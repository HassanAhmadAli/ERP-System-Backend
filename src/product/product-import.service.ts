import { BadRequestException, Injectable } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

import { PrismaService } from "@/prisma/prisma.service";
import { parse } from "csv-parse/sync";
import { Prisma } from "@/prisma/client";
import {
  formatProductImportZodError,
  PRODUCT_IMPORT_CSV_COLUMNS,
  ProductImportCsvFileSchema,
  ProductImportCsvRowSchema,
  type ProductImportCsvFile,
} from "./dto/product-import.schema";

const OPTIONAL_CSV_COLUMNS = new Set(["description", "nameAr", "descriptionAr"]);
const REQUIRED_CSV_HEADERS = PRODUCT_IMPORT_CSV_COLUMNS.filter(
  (column): column is Exclude<PRODUCT_IMPORT_CSV_COLUMNS, typeof column> => !OPTIONAL_CSV_COLUMNS.has(column),
);

/** Max rows per `createMany` call to stay within DB/driver limits. */
const CREATE_MANY_BATCH_SIZE = 500;

type ImportRowError = { row: number; message: string };

type PreparedImportRow = {
  rowNum: number;
  data: Prisma.ProductCreateManyInput;
};

@Injectable()
export class ProductImportService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async importFromCsv(userId: number, fileName: string, csvContent: string) {
    const rawRows = this.parseCsvFile(csvContent);
    const rows = this.validateCsvFile(rawRows);

    const job = await this.prisma.productImportJob.create({
      data: {
        uploadedById: userId,
        fileName,
        status: "PROCESSING",
        totalRows: rows.length,
      },
    });

    const { validRows, errors: validationErrors } = this.validateRows(rows);
    const { toInsert, errors: conflictErrors } = await this.resolveInsertConflicts(validRows);
    const { successCount, errors: insertErrors } = await this.createManyInBatches(toInsert);

    const errors = [...validationErrors, ...conflictErrors, ...insertErrors];
    const status = successCount === 0 ? "FAILED" : "COMPLETED";

    return this.prisma.productImportJob.update({
      where: { id: job.id },
      data: {
        status,
        successCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date(),
      },
    });
  }

  async getJob(id: number) {
    return this.prisma.productImportJob.findUniqueOrThrow({
      where: { id },
      include: { uploadedBy: { select: { id: true, fullName: true, fullNameAr: true, email: true } } },
    });
  }

  listJobs(limit = 20) {
    return this.prisma.productImportJob.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { id: true, fullName: true, fullNameAr: true } } },
    });
  }

  private validateRows(rows: ProductImportCsvFile): {
    validRows: PreparedImportRow[];
    errors: ImportRowError[];
  } {
    const validRows: PreparedImportRow[] = [];
    const errors: ImportRowError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const rowResult = ProductImportCsvRowSchema.safeParse(rows[i]);

      if (!rowResult.success) {
        errors.push({ row: rowNum, message: formatProductImportZodError(rowResult.error) });
        continue;
      }

      validRows.push({
        rowNum,
        data: rowResult.data,
      });
    }

    return { validRows, errors };
  }

  private async resolveInsertConflicts(validRows: PreparedImportRow[]): Promise<{
    toInsert: PreparedImportRow[];
    errors: ImportRowError[];
  }> {
    if (validRows.length === 0) {
      return { toInsert: [], errors: [] };
    }

    const errors: ImportRowError[] = [];
    const seenBarcodes = new Map<string, number>();
    const duplicateInFile = new Set<number>();

    for (const entry of validRows) {
      const firstRow = seenBarcodes.get(entry.data.barcode);
      if (firstRow != undefined) {
        duplicateInFile.add(entry.rowNum);
        errors.push({
          row: entry.rowNum,
          message: this.i18n.t("errors.product.duplicateBarcodeCsv", {
            args: { barcode: entry.data.barcode, row: firstRow },
          }),
        });
      } else {
        seenBarcodes.set(entry.data.barcode, entry.rowNum);
      }
    }

    const candidateRows = validRows.filter((entry) => !duplicateInFile.has(entry.rowNum));
    const barcodes = candidateRows.map((entry) => entry.data.barcode);
    const categoryIds = [...new Set(candidateRows.map((entry) => entry.data.categoryId))];
    const supplierIds = [...new Set(candidateRows.map((entry) => entry.data.supplierId))];

    const [existingProducts, categories, suppliers] = await Promise.all([
      this.prisma.product.findMany({
        where: { barcode: { in: barcodes } },
        select: { barcode: true },
      }),
      this.prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      }),
      this.prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true },
      }),
    ]);

    const existingBarcodeSet = new Set(existingProducts.map((p) => p.barcode));
    const validCategoryIds = new Set(categories.map((c) => c.id));
    const validSupplierIds = new Set(suppliers.map((s) => s.id));

    const toInsert: PreparedImportRow[] = [];

    for (const entry of candidateRows) {
      if (existingBarcodeSet.has(entry.data.barcode)) {
        errors.push({
          row: entry.rowNum,
          message: this.i18n.t("errors.product.barcodeExistsDb", {
            args: { barcode: entry.data.barcode },
          }),
        });
        continue;
      }

      if (!validCategoryIds.has(entry.data.categoryId)) {
        errors.push({
          row: entry.rowNum,
          message: this.i18n.t("errors.product.categoryIdNotFound", {
            args: { id: entry.data.categoryId },
          }),
        });
        continue;
      }

      if (!validSupplierIds.has(entry.data.supplierId)) {
        errors.push({
          row: entry.rowNum,
          message: this.i18n.t("errors.product.supplierIdNotFound", {
            args: { id: entry.data.supplierId },
          }),
        });
        continue;
      }

      toInsert.push(entry);
    }

    return { toInsert, errors };
  }

  private async createManyInBatches(entries: PreparedImportRow[]): Promise<{
    successCount: number;
    errors: ImportRowError[];
  }> {
    if (entries.length === 0) {
      return { successCount: 0, errors: [] };
    }

    const errors: ImportRowError[] = [];
    let successCount = 0;

    for (let offset = 0; offset < entries.length; offset += CREATE_MANY_BATCH_SIZE) {
      const chunk = entries.slice(offset, offset + CREATE_MANY_BATCH_SIZE);

      try {
        const result = await this.prisma.product.createMany({
          data: chunk.map((entry) => entry.data),
        });
        successCount += result.count;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        for (const entry of chunk) {
          errors.push({ row: entry.rowNum, message });
        }
      }
    }

    return { successCount, errors };
  }

  private parseCsvFile(content: string): Record<string, string>[] {
    try {
      const records: Record<string, string>[] = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: false,
        cast: false,
      });

      return records;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid CSV file";
      throw new BadRequestException(this.i18n.t("errors.product.csvParseFailed", { args: { message } }));
    }
  }

  private validateCsvHeaders(columns: string[]): void {
    const missing = REQUIRED_CSV_HEADERS.filter((header) => !columns.includes(header));
    if (missing.length > 0) {
      throw new BadRequestException(
        this.i18n.t("errors.product.missingCsvColumns", {
          args: { columns: missing.join(", ") },
        }),
      );
    }
  }

  private validateCsvFile(rawRows: Record<string, string>[]) {
    if (rawRows.length === 0) {
      throw new BadRequestException(this.i18n.t("errors.product.csvNoData"));
    }

    this.validateCsvHeaders(Object.keys(rawRows[0]!));

    const fileResult = ProductImportCsvFileSchema.safeParse(rawRows);
    if (!fileResult.success) {
      throw new BadRequestException(formatProductImportZodError(fileResult.error));
    }

    return fileResult.data;
  }
}

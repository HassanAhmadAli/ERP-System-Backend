/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { ProductImportService } from "./product-import.service";
import { PrismaService } from "@/prisma/prisma.service";

const CSV_HEADERS = [
  "name",
  "nameAr",
  "barcode",
  "purchasePrice",
  "sellingPrice",
  "quantityInStock",
  "minQuantity",
  "categoryId",
  "supplierId",
  "description",
  "descriptionAr",
];

function csvLine(values: string[]): string {
  return CSV_HEADERS.map((_, index) => values[index] ?? "").join(",");
}

function buildCsv(rows: string[][]): string {
  return [CSV_HEADERS.join(","), ...rows.map(csvLine)].join("\n");
}

const validRow = (overrides: Partial<Record<(typeof CSV_HEADERS)[number], string>> = {}) => [
  overrides.name ?? "Wireless Mouse",
  overrides.nameAr ?? "فأرة لاسلكية",
  overrides.barcode ?? "100000000099",
  overrides.purchasePrice ?? "12.5",
  overrides.sellingPrice ?? "29.99",
  overrides.quantityInStock ?? "50",
  overrides.minQuantity ?? "5",
  overrides.categoryId ?? "1",
  overrides.supplierId ?? "2",
  overrides.description ?? "desc",
  overrides.descriptionAr ?? "وصف",
];

describe("ProductImportService", () => {
  let service: ProductImportService;
  let prismaService: jest.Mocked<PrismaService>;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  const mockJob = {
    id: 1,
    uploadedById: 10,
    fileName: "products.csv",
    status: "COMPLETED" as const,
    totalRows: 1,
    successCount: 1,
    errorCount: 0,
    errors: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductImportService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              productImportJob: {
                create: jest.fn(),
                update: jest.fn(),
                findUniqueOrThrow: jest.fn(),
                findMany: jest.fn(),
              },
              product: {
                findMany: jest.fn(),
                createMany: jest.fn(),
              },
              category: {
                findMany: jest.fn(),
              },
              supplier: {
                findMany: jest.fn(),
              },
            },
          },
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn().mockImplementation((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get(ProductImportService);
    prismaService = module.get(PrismaService);
    i18nService = module.get(I18nService);

    jest.mocked(prismaService.client.productImportJob.create).mockResolvedValue(mockJob as never);
    jest.mocked(prismaService.client.productImportJob.update).mockResolvedValue(mockJob as never);
    jest.mocked(prismaService.client.product.findMany).mockResolvedValue([] as never);
    jest.mocked(prismaService.client.category.findMany).mockResolvedValue([{ id: 1 }] as never);
    jest.mocked(prismaService.client.supplier.findMany).mockResolvedValue([{ id: 2 }] as never);
    jest.mocked(prismaService.client.product.createMany).mockResolvedValue({ count: 0, ids: [] } as never);
  });

  describe("importFromCsv", () => {
    it("imports a valid CSV and completes the job", async () => {
      const csv = buildCsv([validRow()]);
      jest.mocked(prismaService.client.product.createMany).mockResolvedValue({ count: 1, ids: [] } as never);

      const result = await service.importFromCsv(10, "products.csv", csv);

      expect(result).toStrictEqual(mockJob);
      expect(prismaService.client.productImportJob.create).toHaveBeenCalledWith({
        data: { uploadedById: 10, fileName: "products.csv", status: "PROCESSING", totalRows: 1 },
      });
      expect(prismaService.client.productImportJob.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "COMPLETED",
          successCount: 1,
          errorCount: 0,
          errors: undefined,
          completedAt: expect.any(Date),
        },
      });
      expect(prismaService.client.product.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            name: "Wireless Mouse",
            barcode: "100000000099",
            categoryId: 1,
            supplierId: 2,
          }),
        ],
      });
    });

    it("throws BadRequestException when the CSV has no data rows", async () => {
      const csv = CSV_HEADERS.join(",");

      await expect(service.importFromCsv(10, "products.csv", csv)).rejects.toThrow(BadRequestException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.product.csvNoData");
    });

    it("throws BadRequestException when required headers are missing", async () => {
      const csv = "name,barcode\nMouse,123";

      await expect(service.importFromCsv(10, "products.csv", csv)).rejects.toThrow(BadRequestException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.product.missingCsvColumns", {
        args: { columns: expect.stringContaining("categoryId") },
      });
    });

    it("throws BadRequestException when a row fails validation", async () => {
      const csv = buildCsv([validRow({ name: "A" })]);

      await expect(service.importFromCsv(10, "products.csv", csv)).rejects.toThrow(BadRequestException);
      expect(prismaService.client.productImportJob.create).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when the CSV is malformed", async () => {
      const csv =
        "name,nameAr,barcode,purchasePrice,sellingPrice,quantityInStock,minQuantity,categoryId,supplierId,description,descriptionAr\nMouse,فأرة,123,1,2,3,4,5,6,7";

      await expect(service.importFromCsv(10, "products.csv", csv)).rejects.toThrow(BadRequestException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.product.csvParseFailed", expect.anything());
    });

    it("records a conflict error for duplicate barcodes within the file", async () => {
      const csv = buildCsv([validRow(), validRow({ name: "Duplicate Mouse" })]);
      jest.mocked(prismaService.client.product.createMany).mockResolvedValue({ count: 1, ids: [] } as never);

      const result = await service.importFromCsv(10, "products.csv", csv);

      expect(prismaService.client.productImportJob.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: "COMPLETED",
          successCount: 1,
          errorCount: 1,
          errors: [{ row: 3, message: "errors.product.duplicateBarcodeCsv" }],
        }),
      });
      expect(i18nService.t).toHaveBeenCalledWith("errors.product.duplicateBarcodeCsv", {
        args: { barcode: "100000000099", row: 2 },
      });
      expect(result).toStrictEqual(mockJob);
    });

    it("records errors for barcodes that already exist in the database", async () => {
      const csv = buildCsv([validRow()]);
      jest.mocked(prismaService.client.product.findMany).mockResolvedValue([{ barcode: "100000000099" }] as never);

      await service.importFromCsv(10, "products.csv", csv);

      expect(prismaService.client.productImportJob.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: "FAILED",
          successCount: 0,
          errorCount: 1,
          errors: [{ row: 2, message: "errors.product.barcodeExistsDb" }],
        }),
      });
      expect(prismaService.client.product.createMany).not.toHaveBeenCalled();
    });

    it("records errors for unknown category and supplier ids", async () => {
      const csv = buildCsv([validRow({ categoryId: "99" }), validRow({ supplierId: "99", barcode: "200000000000" })]);
      jest.mocked(prismaService.client.supplier.findMany).mockResolvedValue([] as never);

      await service.importFromCsv(10, "products.csv", csv);

      expect(prismaService.client.productImportJob.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: "FAILED",
          successCount: 0,
          errorCount: 2,
          errors: [
            { row: 2, message: "errors.product.categoryIdNotFound" },
            { row: 3, message: "errors.product.supplierIdNotFound" },
          ],
        }),
      });
    });

    it("marks the job COMPLETED with partial success", async () => {
      const csv = buildCsv([validRow(), validRow({ barcode: "200000000000" })]);
      jest.mocked(prismaService.client.product.findMany).mockResolvedValue([{ barcode: "100000000099" }] as never);
      jest.mocked(prismaService.client.product.createMany).mockResolvedValue({ count: 1, ids: [] } as never);

      await service.importFromCsv(10, "products.csv", csv);

      expect(prismaService.client.productImportJob.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: "COMPLETED", successCount: 1, errorCount: 1 }),
      });
    });

    it("inserts in batches of 500 rows", async () => {
      const rows = Array.from({ length: 501 }, (_, index) =>
        validRow({ barcode: `100${String(index).padStart(9, "0")}` }),
      );
      const csv = buildCsv(rows);
      jest.mocked(prismaService.client.product.createMany).mockResolvedValue({ count: 500, ids: [] } as never);

      await service.importFromCsv(10, "products.csv", csv);

      expect(prismaService.client.product.createMany).toHaveBeenCalledTimes(2);
      const firstCall = jest.mocked(prismaService.client.product.createMany).mock.calls[0]!;
      const secondCall = jest.mocked(prismaService.client.product.createMany).mock.calls[1]!;
      expect(firstCall[0]?.data).toHaveLength(500);
      expect(secondCall[0]?.data).toHaveLength(1);
    });

    it("records insert failures and marks the job FAILED", async () => {
      const csv = buildCsv([validRow()]);
      jest.mocked(prismaService.client.product.createMany).mockRejectedValue(new Error("insert failed"));

      await service.importFromCsv(10, "products.csv", csv);

      expect(prismaService.client.productImportJob.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: "FAILED",
          successCount: 0,
          errorCount: 1,
          errors: [{ row: 2, message: "insert failed" }],
        }),
      });
    });
  });

  describe("getJob", () => {
    it("returns the job with uploader included", async () => {
      const jobWithUploader = {
        ...mockJob,
        uploadedBy: { id: 10, fullName: "Manager", fullNameAr: null, email: "m@t.com" },
      };
      jest.mocked(prismaService.client.productImportJob.findUniqueOrThrow).mockResolvedValue(jobWithUploader as never);

      const result = await service.getJob(1);

      expect(result).toStrictEqual(jobWithUploader);
      expect(prismaService.client.productImportJob.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { uploadedBy: { select: { id: true, fullName: true, fullNameAr: true, email: true } } },
      });
    });
  });

  describe("listJobs", () => {
    it("returns recent jobs with uploader included", async () => {
      jest.mocked(prismaService.client.productImportJob.findMany).mockResolvedValue([mockJob] as never);

      const result = await service.listJobs();

      expect(result).toStrictEqual([mockJob]);
      expect(prismaService.client.productImportJob.findMany).toHaveBeenCalledWith({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { id: true, fullName: true, fullNameAr: true } } },
      });
    });
  });
});

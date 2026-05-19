import { z } from "zod";
import { CreateProductSchema } from "./product.schema";

/** Required column headers in the uploaded CSV (first row). */
export const PRODUCT_IMPORT_CSV_COLUMNS = [
  "name",
  "barcode",
  "purchasePrice",
  "sellingPrice",
  "quantityInStock",
  "minQuantity",
  "categoryId",
  "supplierId",
  "description",
] as const;

export type ProductImportCsvColumn = (typeof PRODUCT_IMPORT_CSV_COLUMNS)[number];

const optionalStringFromCsv = z
  .string()
  .optional()
  .transform((value) => (value === "" || value == undefined ? undefined : value));

export const ProductImportCsvRowSchema = z
  .object({
    name: z.string().trim().min(2),
    barcode: z.string().trim().min(3),
    purchasePrice: z.coerce.number().positive(),
    sellingPrice: z.coerce.number().positive(),
    quantityInStock: z.coerce.number().int().min(0),
    minQuantity: z.coerce.number().int().min(0),
    categoryId: z.coerce.number().int().positive(),
    supplierId: z.coerce.number().int().positive(),
    description: optionalStringFromCsv,
  })
  .strict();

export type ProductImportCsvRow = z.infer<typeof ProductImportCsvRowSchema>;

export const ProductImportCsvFileSchema = z
  .array(ProductImportCsvRowSchema)
  .min(1, "CSV file must contain at least one product row");

export type ProductImportCsvFile = z.infer<typeof ProductImportCsvFileSchema>;

export const ProductImportRowToCreateSchema = ProductImportCsvRowSchema.transform((row) =>
  CreateProductSchema.parse({
    name: row.name,
    barcode: row.barcode,
    purchasePrice: row.purchasePrice,
    sellingPrice: row.sellingPrice,
    quantityInStock: row.quantityInStock,
    minQuantity: row.minQuantity,
    categoryId: row.categoryId,
    supplierId: row.supplierId,
    description: row.description,
  }),
);

export function formatProductImportZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`).join("; ");
}

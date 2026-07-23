import { z } from "zod";
import { CreateProductSchema } from "./shared.schema";
import { emptyStringToUndefined } from "@/common/schema/helper";

/** Required column headers in the uploaded CSV (first row). */
export const PRODUCT_IMPORT_CSV_COLUMNS = [
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
] as const;

export type PRODUCT_IMPORT_CSV_COLUMNS = (typeof PRODUCT_IMPORT_CSV_COLUMNS)[number];

export const ProductImportCsvRowSchema = CreateProductSchema.extend({
  name: z.string().min(2).trim(),
  description: emptyStringToUndefined(z.string().trim()),
  barcode: z.string().trim().min(3),
}).strict();

export type ProductImportCsvRow = z.infer<typeof ProductImportCsvRowSchema>;

export const ProductImportCsvFileSchema = z
  .array(ProductImportCsvRowSchema)
  .min(1, "CSV file must contain at least one product row");

export type ProductImportCsvFile = z.infer<typeof ProductImportCsvFileSchema>;

export function formatProductImportZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`).join("; ");
}

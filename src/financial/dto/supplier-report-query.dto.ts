import { z } from "zod";
import { FinancialDateRangeSchema } from "./shared.schema";
import { createZodDto } from "nestjs-zod";

export const SupplierReportQuerySchema = FinancialDateRangeSchema.extend({
  supplierId: z.coerce.number().int(),
});
export class SupplierReportQueryDto extends createZodDto(SupplierReportQuerySchema) {}

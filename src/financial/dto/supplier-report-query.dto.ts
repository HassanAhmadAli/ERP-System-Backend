import { z } from "zod";
import { FinancialDateRangeSchema } from "./shared.schemas";
import { createZodDto } from "nestjs-zod";

export const SupplierReportQuerySchema = FinancialDateRangeSchema.extend({
  supplierId: z.coerce.number().int(),
});
export class SupplierReportQueryDto extends createZodDto(SupplierReportQuerySchema) {}

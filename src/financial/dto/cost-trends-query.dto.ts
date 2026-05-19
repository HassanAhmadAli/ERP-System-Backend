import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { FinancialDateRangeSchema } from "./shared.schema";

export const CostTrendsQuerySchema = FinancialDateRangeSchema.extend({
  productId: z.coerce.number().int().optional(),
  groupBy: z.enum(["day", "week", "month"]).default("month"),
});

export class CostTrendsQueryDto extends createZodDto(CostTrendsQuerySchema) {}

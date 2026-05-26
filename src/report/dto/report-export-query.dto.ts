import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { ReportSummaryQuerySchema } from "./shared.schema";

export const ReportExportQuerySchema = ReportSummaryQuerySchema.extend({
  type: z.enum(["summary", "inventory", "sales", "purchases", "profit-margins"]).default("summary"),
});

export class ReportExportQueryDto extends createZodDto(ReportExportQuerySchema) {}

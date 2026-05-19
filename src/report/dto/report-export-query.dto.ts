import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { ReportSummaryQuerySchema } from "../schema/report.schema";

export const ReportExportQuerySchema = ReportSummaryQuerySchema.extend({
  type: z.enum(["summary", "inventory", "sales", "profit-margins"]).default("summary"),
});

export class ReportExportQueryDto extends createZodDto(ReportExportQuerySchema) {}

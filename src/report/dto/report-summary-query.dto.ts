import { createZodDto } from "nestjs-zod";
import { ReportSummaryQuerySchema } from "../schema/report.schema";

export class ReportSummaryQueryDto extends createZodDto(ReportSummaryQuerySchema) {}

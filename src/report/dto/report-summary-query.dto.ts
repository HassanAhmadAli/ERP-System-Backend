import { createZodDto } from "nestjs-zod";
import { ReportSummaryQuerySchema } from "./shared.schema";

export class ReportSummaryQueryDto extends createZodDto(ReportSummaryQuerySchema) {}

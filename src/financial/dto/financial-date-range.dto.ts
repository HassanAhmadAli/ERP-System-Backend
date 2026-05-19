import { createZodDto } from "nestjs-zod";
import { FinancialDateRangeSchema } from "./shared.schema";

export class FinancialDateRangeDto extends createZodDto(FinancialDateRangeSchema) {}

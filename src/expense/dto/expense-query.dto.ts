import { createZodDto } from "nestjs-zod";
import { ExpenseQuerySchema } from "../schema/expense.schema";

export class ExpenseQueryDto extends createZodDto(ExpenseQuerySchema) {}

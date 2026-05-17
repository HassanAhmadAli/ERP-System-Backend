import { createZodDto } from "nestjs-zod";
import { CreateExpenseSchema } from "../schema/expense.schema";

export class CreateExpenseDto extends createZodDto(CreateExpenseSchema) {}

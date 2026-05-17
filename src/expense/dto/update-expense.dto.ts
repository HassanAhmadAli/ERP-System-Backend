import { createZodDto } from "nestjs-zod";
import { UpdateExpenseSchema } from "../schema/expense.schema";

export class UpdateExpenseDto extends createZodDto(UpdateExpenseSchema) {}

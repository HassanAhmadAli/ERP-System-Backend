import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { Prisma } from "@/prisma";
import { stringToDateSchema } from "@/common/schema/date.schema";
export const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  amount: z.coerce
    .number()
    .positive()
    .min(1)
    .transform((x) => new Prisma.Decimal(x)),
  expenseDate: stringToDateSchema,
});
export class CreateExpenseDto extends createZodDto(CreateExpenseSchema) {}

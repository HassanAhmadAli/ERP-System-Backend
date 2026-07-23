import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { Prisma } from "@/prisma/client";
import { stringToDateSchema } from "@/common/schema/date.schema";

export const UpdateExpenseSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  descriptionAr: z.string().min(1).max(500).optional(),
  category: z.string().min(1).max(100).optional(),
  categoryAr: z.string().min(1).max(100).optional(),
  amount: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x))
    .optional(),
  expenseDate: stringToDateSchema.optional(),
});
export class UpdateExpenseDto extends createZodDto(UpdateExpenseSchema) {}

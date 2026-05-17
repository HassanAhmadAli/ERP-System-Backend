import { z } from "zod";
import { Prisma } from "@/prisma";
import { stringToDateSchema } from "@/common/schema/date.schema";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";
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

export const UpdateExpenseSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  category: z.string().min(1).max(100).optional(),
  amount: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x))
    .optional(),
  expenseDate: stringToDateSchema.optional(),
});

export const ExpenseQuerySchema = PaginationQuerySchema.extend({
  category: z.string().optional(),
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});

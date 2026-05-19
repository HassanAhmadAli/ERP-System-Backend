import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { stringToDateSchema } from "@/common/schema/date.schema";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";

export const ExpenseQuerySchema = PaginationQuerySchema.extend({
  category: z.string().optional(),
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});

export class ExpenseQueryDto extends createZodDto(ExpenseQuerySchema) {}

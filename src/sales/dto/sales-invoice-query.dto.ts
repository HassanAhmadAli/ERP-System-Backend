import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { InvoiceStatus } from "@/prisma/client";
import { stringToDateSchema } from "@/common/schema/date.schema";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";
export const SalesInvoiceQuerySchema = PaginationQuerySchema.extend({
  status: z.enum(InvoiceStatus).optional(),
  cashierId: z.coerce.number().int().positive().optional(),
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});
export class SalesInvoiceQueryDto extends createZodDto(SalesInvoiceQuerySchema) {}

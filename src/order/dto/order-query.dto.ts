import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { OrderStatus } from "@/prisma/client";
import { stringToDateSchema } from "@/common/schema/date.schema";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";
export const OrderQuerySchema = PaginationQuerySchema.extend({
  status: z.enum(OrderStatus).optional(),
  customerId: z.coerce.number().int().positive().optional(),
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});
export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}

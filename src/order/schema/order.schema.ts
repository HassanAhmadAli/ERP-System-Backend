import { z } from "zod";
import { OrderStatus } from "@/prisma";
import { stringToDateSchema } from "@/common/schema/date.schema";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";

export const OrderItemInputSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

export const CreateOrderSchema = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  discountId: z.coerce.number().int().positive().nullish(),
  loyaltyPointsUsed: z.coerce.number().int().min(0).default(0),
  deliveryAddress: z.string().min(1).optional(),
  items: z.array(OrderItemInputSchema).min(1),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(OrderStatus),
});

export const OrderQuerySchema = PaginationQuerySchema.extend({
  status: z.enum(OrderStatus).optional(),
  customerId: z.coerce.number().int().positive().optional(),
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});

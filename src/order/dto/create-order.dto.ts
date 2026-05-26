import { createZodDto } from "nestjs-zod";
import { z } from "zod";
export const OrderItemInputSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});
const CreateOrderSchema = z.object({
  discountId: z.coerce.number().int().positive().nullish(),
  loyaltyPointsUsed: z.coerce.number().int().min(0).default(0),
  deliveryAddress: z.string().min(1).optional(),
  items: z.array(OrderItemInputSchema).min(1),
});

const CreateCashierOrderSchema = CreateOrderSchema.extend({
  customerId: z.coerce.number().int().positive(),
});
export class CreateCashierOrderDto extends createZodDto(CreateCashierOrderSchema) {}
export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}

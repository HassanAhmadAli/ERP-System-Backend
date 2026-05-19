import { createZodDto } from "nestjs-zod";
import { z } from "zod";
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
export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}

import { SEED } from "@/openapi/examples";
import { openapiMeta } from "@/openapi/meta";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const OrderItemInputSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

const CreateOrderBaseSchema = z.object({
  discountId: z.coerce.number().int().positive().nullish(),
  deliveryAddress: z.string().min(1).optional(),
  deliveryAddressAr: z.string().min(1).optional(),
  items: z.array(OrderItemInputSchema).min(1),
});

export const CreateOrderSchema = openapiMeta(CreateOrderBaseSchema, "CreateOrderDto", {
  discountId: SEED.discountId,
  deliveryAddress: "123 Main St, Springfield",
  deliveryAddressAr: "123 الشارع الرئيسي، سبرينغفيلد",
  items: [{ productId: SEED.productId2, quantity: 2 }],
});

export const CreateCashierOrderSchema = openapiMeta(
  CreateOrderBaseSchema.extend({
    customerId: z.coerce.number().int().positive(),
  }),
  "CreateCashierOrderDto",
  {
    customerId: SEED.customerId,
    deliveryAddressAr: "456 شارع الأمل، القاهرة",
    items: [{ productId: SEED.productId, quantity: 1 }],
  },
);

export class CreateCashierOrderDto extends createZodDto(CreateCashierOrderSchema) {}
export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}

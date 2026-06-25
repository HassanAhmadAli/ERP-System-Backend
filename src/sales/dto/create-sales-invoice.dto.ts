import { SEED } from "@/openapi/examples";
import { openapiMeta } from "@/openapi/meta";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const SaleItemInputSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

export const CreateSalesInvoiceSchema = openapiMeta(
  z.object({
    customerId: z.coerce.number().int().positive().optional(),
    discountId: z.coerce.number().int().positive().nullish(),
    items: z.array(SaleItemInputSchema).min(1),
    complete: z.boolean().default(false),
  }),
  "CreateSalesInvoiceDto",
  {
    customerId: SEED.customerId,
    discountId: SEED.discountId,
    items: [{ productId: SEED.productId, quantity: 1 }],
    complete: true,
  },
);
export class CreateSalesInvoiceDto extends createZodDto(CreateSalesInvoiceSchema) {}

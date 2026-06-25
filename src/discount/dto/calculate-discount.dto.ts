import { Prisma } from "@/prisma/client";
import { SEED } from "@/openapi/examples";
import { openapiMeta } from "@/openapi/meta";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CalculateDiscountSchema = openapiMeta(
  z.object({
    discountId: z.coerce.number().int().positive(),
    subtotal: z.coerce.number().transform((x) => new Prisma.Decimal(x)),
    customerId: z.coerce.number().int().positive().nullish(),
    productId: z.coerce.number().int().positive().nullish(),
    categoryId: z.coerce.number().int().positive().nullish(),
  }),
  "CalculateDiscountDto",
  {
    discountId: SEED.discountId,
    subtotal: 29.99,
    customerId: SEED.customerId,
    productId: SEED.productId,
  },
);

export class CalculateDiscountDto extends createZodDto(CalculateDiscountSchema) {}

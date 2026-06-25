import { Prisma } from "@/prisma/client";
import { SEED } from "@/openapi/examples";
import { openapiMeta } from "@/openapi/meta";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CalculateBestDiscountSchema = openapiMeta(
  z.object({
    subtotal: z.coerce.number().transform((x) => new Prisma.Decimal(x)),
    productId: z.coerce.number().int().positive().nullish(),
    categoryId: z.coerce.number().int().positive().nullish(),
  }),
  "CalculateBestDiscountDto",
  {
    subtotal: 29.99,
    customerId: SEED.customerId,
    productId: SEED.productId,
  },
);

export class CalculateBestDiscountDto extends createZodDto(CalculateBestDiscountSchema) {}

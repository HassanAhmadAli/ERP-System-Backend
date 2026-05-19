import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CalculateDiscountSchema = z.object({
  discountId: z.coerce.number().int().positive(),
  subtotal: z.coerce.number().positive(),
  customerId: z.coerce.number().int().positive().nullish(),
  productId: z.coerce.number().int().positive().nullish(),
  categoryId: z.coerce.number().int().positive().nullish(),
});

export class CalculateDiscountDto extends createZodDto(CalculateDiscountSchema) {}

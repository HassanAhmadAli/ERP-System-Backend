import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { DiscountScope, DiscountType, Prisma } from "@/prisma/client";
import { stringToDateSchema } from "@/common/schema/date.schema";
export const UpdateDiscountSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  type: z.enum(DiscountType).optional(),
  value: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x))
    .optional(),
  scope: z.enum(DiscountScope).optional(),
  maxInvoiceValue: z.coerce
    .number()
    .min(0)
    .transform((x) => new Prisma.Decimal(x))
    .optional(),
  maxUses: z.coerce.number().int().positive().nullish(),
  startDate: stringToDateSchema.optional(),
  endDate: stringToDateSchema.nullish(),
  isActive: z.boolean().optional(),
  productId: z.coerce.number().int().positive().nullish(),
  categoryId: z.coerce.number().int().positive().nullish(),
  customerId: z.coerce.number().int().positive().nullish(),
});
export class UpdateDiscountDto extends createZodDto(UpdateDiscountSchema) {}

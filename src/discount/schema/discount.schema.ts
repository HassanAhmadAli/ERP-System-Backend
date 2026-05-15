import { z } from "zod";
import { DiscountScope, DiscountType, Prisma } from "@/prisma";

export const CreateDiscountSchema = z
  .object({
    name: z.string().min(2).max(100),
    type: z.enum(DiscountType),
    value: z.coerce
      .number()
      .positive()
      .transform((x) => new Prisma.Decimal(x)),
    scope: z.enum(DiscountScope),
    maxInvoiceValue: z.coerce
      .number()
      .min(0)
      .default(0)
      .transform((x) => new Prisma.Decimal(x)),
    maxUses: z.coerce.number().int().positive().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate >= data.endDate) {
        return false;
      }
      return true;
    },
    { message: "endDate must be after startDate", path: ["endDate"] },
  );

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
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

/** Schema for the discount calculation request */
export const CalculateDiscountSchema = z.object({
  discountId: z.coerce.number().int().positive(),
  subtotal: z.coerce.number().positive(),
  customerId: z.coerce.number().int().positive().nullable().optional(),
  productId: z.coerce.number().int().positive().nullable().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
});

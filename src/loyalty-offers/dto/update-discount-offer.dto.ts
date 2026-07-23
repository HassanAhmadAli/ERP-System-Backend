import { createZodDto } from "nestjs-zod";

import { Prisma, DiscountType } from "@/prisma/client";
import z from "zod";

export const UpdateLoyaltyRewardSchema = z
  .object({
    name: z.string().min(2).optional(),
    nameAr: z.string().min(2).optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    pointsCost: z.coerce.number().int().positive(),
    discountType: z.enum(DiscountType).optional(),
    discountValue: z.coerce
      .number()
      .positive()
      .transform((x) => new Prisma.Decimal(x))
      .optional(),
    maxUses: z.coerce.number().int().positive().optional(),
    validityDays: z.coerce.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export class UpdateLoyaltyRewardDto extends createZodDto(UpdateLoyaltyRewardSchema) {}

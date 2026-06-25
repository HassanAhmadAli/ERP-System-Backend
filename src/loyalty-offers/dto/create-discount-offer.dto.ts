import { createZodDto } from "nestjs-zod";
import { Prisma, DiscountType } from "@/prisma/client";
import { z } from "zod";

export const CreateLoyaltyRewardSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  pointsCost: z.coerce.number().int().positive(),
  discountType: z.enum(DiscountType),
  discountValue: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x)),
  maxUses: z.coerce.number().int().positive().default(1),
  validityDays: z.coerce.number().int().positive().default(7),
  isActive: z.boolean().default(true),
});

export class CreateLoyaltyRewardDto extends createZodDto(CreateLoyaltyRewardSchema) {}

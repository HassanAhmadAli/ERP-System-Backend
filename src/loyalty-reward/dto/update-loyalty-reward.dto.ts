import { createZodDto } from "nestjs-zod";
import { Prisma } from "@/prisma";
import { z } from "zod";

export const UpdateLoyaltyRewardSchema = z.object({
  pointsThreshold: z.coerce.number().int().min(1).optional(),
  rewardDescription: z.string().min(1).max(500).optional(),
  discountValue: z.coerce
    .number()
    .min(0)
    .transform((x) => new Prisma.Decimal(x))
    .optional(),
  isActive: z.boolean().optional(),
});

export class UpdateLoyaltyRewardDto extends createZodDto(UpdateLoyaltyRewardSchema) {}

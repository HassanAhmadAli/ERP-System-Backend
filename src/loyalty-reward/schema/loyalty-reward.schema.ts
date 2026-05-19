import { Prisma } from "@/prisma";
import { z } from "zod";

export const CreateLoyaltyRewardSchema = z.object({
  pointsThreshold: z.coerce.number().int().min(1),
  rewardDescription: z.string().min(1).max(500),
  discountValue: z.coerce
    .number()
    .min(0)
    .transform((x) => new Prisma.Decimal(x)),
  isActive: z.boolean().default(true),
});

export const UpdateLoyaltyRewardSchema = CreateLoyaltyRewardSchema.partial();

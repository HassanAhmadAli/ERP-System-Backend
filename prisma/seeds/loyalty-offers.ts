import { DiscountType } from "@/prisma/client";
import { prisma } from "./client-instance";

export const loyaltyDiscountOffersData = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "10% Off Reward",
    description: "10% off next purchase",
    pointsCost: 100,
    discountType: DiscountType.PERCENTAGE,
    discountValue: "10.00",
    maxUses: 1,
    validityDays: 2,
    isActive: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "25 Currency Off Reward",
    description: "25 currency units off next purchase",
    pointsCost: 500,
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: "25.00",
    maxUses: 2,
    validityDays: 4,
    isActive: true,
  },
];

export async function seedLoyaltyDiscountOffers() {
  for (const item of loyaltyDiscountOffersData) {
    await prisma.loyaltyDiscountOffer.create({ data: item });
  }
}

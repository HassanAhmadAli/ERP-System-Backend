import { prisma } from "./client-instance";

export const loyaltyRewardsData = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    pointsThreshold: 100,
    rewardDescription: "10% off next purchase",
    discountValue: "10.00",
    isActive: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    pointsThreshold: 500,
    rewardDescription: "25 currency units off next purchase",
    discountValue: "25.00",
    isActive: true,
  },
];

export async function seedLoyaltyRewards() {
  for (const item of loyaltyRewardsData) {
    await prisma.loyaltyReward.create({ data: item });
  }
}

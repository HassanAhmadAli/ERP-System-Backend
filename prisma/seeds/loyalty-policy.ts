import { DEFAULT_POLICY } from "@/loyalty-reward/loyalty-policy.service";
import { prisma } from "./client-instance";

export async function seedLoyaltyPolicy() {
  await prisma.loyaltyPolicy.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      pointsPerCurrency: DEFAULT_POLICY.pointsPerCurrency,
      currencyPerPoint: DEFAULT_POLICY.currencyPerPoint,
    },
    update: {},
  });
}

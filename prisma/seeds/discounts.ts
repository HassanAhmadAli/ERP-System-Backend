import { DiscountScope, DiscountType, type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { pick, randFloat, randInt } from "./data/generators";
import { CATEGORY_COUNT } from "./categories";
import { PRODUCT_COUNT } from "./products";
import { CUSTOMER_COUNT, CUSTOMER_ID_OFFSET } from "./customers";

const SCOPE_WEIGHTS: { scope: DiscountScope; weight: number }[] = [
  { scope: DiscountScope.GLOBAL, weight: 2 },
  { scope: DiscountScope.CATEGORY, weight: 5 },
  { scope: DiscountScope.PRODUCT, weight: 5 },
  { scope: DiscountScope.CUSTOMER, weight: 3 },
];

const DISCOUNT_NAMES = [
  "Summer Sale",
  "Winter Clearance",
  "Flash Deal",
  "Weekend Special",
  "Holiday Offer",
  "New Customer Discount",
  "Loyalty Reward",
  "Seasonal Promotion",
  "Bundle Discount",
  "Early Bird Special",
  "Midnight Madness",
  "Referral Bonus",
  "Bulk Purchase Discount",
  "Anniversary Sale",
  "Free Shipping Promo",
  "Member Exclusive",
  "Back to School Sale",
  "Black Friday Deal",
  "Cyber Monday Offer",
  "New Year Special",
];

export async function seedDiscounts(tx: PrismaTransactionClient) {
  const discounts: Prisma.DiscountCreateManyInput[] = [];
  const now = new Date();
  const START_DATE = new Date(now.getFullYear() - 1, 0, 1);
  const END_DATE = new Date(now.getFullYear() + 1, 11, 31);

  for (let i = 0; i < 40; i++) {
    const scopePick = SCOPE_WEIGHTS[selectWeighted(SCOPE_WEIGHTS.map((s) => s.weight))]!;
    const scope = scopePick.scope;
    const isPercent = Math.random() > 0.4;
    const value = isPercent ? randFloat(5, 30, 2) : randFloat(2, 50, 2);

    const discount: Prisma.DiscountCreateManyInput = {
      id: i + 1,
      name: pick(DISCOUNT_NAMES) + (i > 15 ? ` #${i}` : ""),
      type: isPercent ? DiscountType.PERCENTAGE : DiscountType.FIXED_AMOUNT,
      value,
      scope,
      maxInvoiceValue: isPercent ? randFloat(50, 500, 2) : randFloat(50, 300, 2),
      maxUses: Math.random() > 0.3 ? randInt(10, 500) : null,
      usedCount: randInt(0, 50),
      startDate: START_DATE,
      endDate: Math.random() > 0.2 ? END_DATE : null,
      isActive: Math.random() > 0.15,
      createdById: 1,
      productId: null,
      categoryId: null,
      customerId: null,
    };

    if (scope === DiscountScope.PRODUCT) {
      discount.productId = randInt(1, PRODUCT_COUNT);
    } else if (scope === DiscountScope.CATEGORY) {
      discount.categoryId = randInt(1, CATEGORY_COUNT);
    } else if (scope === DiscountScope.CUSTOMER) {
      discount.customerId = randInt(CUSTOMER_ID_OFFSET, CUSTOMER_ID_OFFSET + CUSTOMER_COUNT - 1);
    }

    discounts.push(discount);
  }

  await tx.discount.createMany({ data: discounts });
}

function selectWeighted(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

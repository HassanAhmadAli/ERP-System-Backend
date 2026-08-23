import type { Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { DISCOUNT_RULES, discountDate } from "./data/discount-rules";
import { discountUsageFromSales } from "./sales";
import { discountUsageFromOrders } from "./orders";

export const DISCOUNT_COUNT = DISCOUNT_RULES.length;

export async function seedDiscounts(tx: PrismaTransactionClient) {
  const now = new Date();
  const usage = new Map<number, number>();

  for (const [discountId, count] of Object.entries(discountUsageFromSales)) {
    usage.set(Number(discountId), (usage.get(Number(discountId)) ?? 0) + count);
  }
  for (const [discountId, count] of Object.entries(discountUsageFromOrders)) {
    usage.set(Number(discountId), (usage.get(Number(discountId)) ?? 0) + count);
  }

  const data: Prisma.DiscountCreateManyInput[] = DISCOUNT_RULES.map((rule) => ({
    id: rule.id,
    name: rule.name,
    nameAr: rule.nameAr,
    type: rule.type,
    value: String(rule.value),
    scope: rule.scope,
    maxInvoiceValue: String(rule.maxInvoiceValue),
    maxUses: rule.maxUses,
    usedCount: usage.get(rule.id) ?? 0,
    startDate: discountDate(rule, now, "start")!,
    endDate: discountDate(rule, now, "end"),
    isActive: rule.isActive,
    createdById: 1,
    productId: rule.productId,
    categoryId: rule.categoryId,
    customerId: rule.customerId,
  }));

  await tx.discount.createMany({ data });
}

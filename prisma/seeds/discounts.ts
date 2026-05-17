import { DiscountScope, DiscountType } from "@/prisma";
import { prisma } from "./client-instance";

export const discountsData = [
  {
    id: 1,
    name: "Store-wide Spring Sale",
    type: DiscountType.PERCENTAGE,
    value: "10.00",
    scope: DiscountScope.GLOBAL,
    maxInvoiceValue: "50.00",
    maxUses: 100,
    usedCount: 1,
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    endDate: new Date("2026-12-31T23:59:59.000Z"),
    isActive: true,
    createdById: 1,
  },
  {
    id: 2,
    name: "Wireless Mouse Promo",
    type: DiscountType.FIXED_AMOUNT,
    value: "5.00",
    scope: DiscountScope.PRODUCT,
    maxInvoiceValue: "0.00",
    maxUses: null,
    usedCount: 0,
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    endDate: null,
    isActive: true,
    createdById: 1,
  },
];

export async function seedDiscounts() {
  for (const item of discountsData) {
    await prisma.discount.create({ data: item });
  }
}

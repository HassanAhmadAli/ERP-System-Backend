import { DiscountScope, DiscountType } from "@/prisma/client";
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
    productId: null,
    categoryId: null,
  },
  {
    id: 2,
    name: "Wireless Mouse Promo",
    type: DiscountType.FIXED_AMOUNT,
    value: "5.00",
    scope: DiscountScope.PRODUCT,
    maxInvoiceValue: "110.00",
    maxUses: null,
    usedCount: 0,
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    endDate: null,
    isActive: true,
    createdById: 1,
    productId: 1,
    categoryId: null,
  },
  {
    id: 3,
    name: "Vegetables Promo",
    type: DiscountType.PERCENTAGE,
    value: "5.00",
    scope: DiscountScope.CATEGORY,
    maxInvoiceValue: "110.00",
    maxUses: null,
    usedCount: 0,
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    endDate: null,
    isActive: true,
    createdById: 1,
    productId: null,
    categoryId: 2,
  },
];

export async function seedDiscounts() {
  for (const item of discountsData) {
    await prisma.discount.create({ data: item });
  }
}

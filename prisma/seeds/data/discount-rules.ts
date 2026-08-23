import { DiscountScope, DiscountType } from "@/prisma/client";

export interface DiscountRule {
  id: number;
  name: string;
  nameAr: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  maxInvoiceValue: number;
  maxUses: number | null;
  startDateOffsetDays: number;
  endDateOffsetDays: number | null;
  isActive: boolean;
  productId: number | null;
  categoryId: number | null;
  customerId: number | null;
}

export const DISCOUNT_RULES: DiscountRule[] = [
  {
    id: 1,
    name: "Ramadan Special Offer",
    nameAr: "عرض رمضان الخاص",
    type: DiscountType.PERCENTAGE,
    value: 15,
    scope: DiscountScope.GLOBAL,
    maxInvoiceValue: 500_000,
    maxUses: null,
    startDateOffsetDays: -120,
    endDateOffsetDays: 60,
    isActive: true,
    productId: null,
    categoryId: null,
    customerId: null,
  },
  {
    id: 2,
    name: "Weekend Deal",
    nameAr: "عرض نهاية الأسبوع",
    type: DiscountType.PERCENTAGE,
    value: 10,
    scope: DiscountScope.GLOBAL,
    maxInvoiceValue: 400_000,
    maxUses: null,
    startDateOffsetDays: -90,
    endDateOffsetDays: null,
    isActive: true,
    productId: null,
    categoryId: null,
    customerId: null,
  },
  {
    id: 3,
    name: "Pantry Days",
    nameAr: "أيام المونة",
    type: DiscountType.PERCENTAGE,
    value: 20,
    scope: DiscountScope.CATEGORY,
    maxInvoiceValue: 300_000,
    maxUses: 200,
    startDateOffsetDays: -30,
    endDateOffsetDays: 20,
    isActive: true,
    productId: null,
    categoryId: 6,
    customerId: null,
  },
  {
    id: 4,
    name: "Dairy Week",
    nameAr: "أسبوع الألبان",
    type: DiscountType.PERCENTAGE,
    value: 25,
    scope: DiscountScope.CATEGORY,
    maxInvoiceValue: 200_000,
    maxUses: 300,
    startDateOffsetDays: -150,
    endDateOffsetDays: 45,
    isActive: true,
    productId: null,
    categoryId: 3,
    customerId: null,
  },
  {
    id: 5,
    name: "Grains Bundle Offer",
    nameAr: "عرض باقة الحبوب",
    type: DiscountType.FIXED_AMOUNT,
    value: 25_000,
    scope: DiscountScope.CATEGORY,
    maxInvoiceValue: 150_000,
    maxUses: 500,
    startDateOffsetDays: -200,
    endDateOffsetDays: null,
    isActive: true,
    productId: null,
    categoryId: 5,
    customerId: null,
  },
  {
    id: 6,
    name: "Olive Oil Launch Offer",
    nameAr: "عرض زيت الزيتون الجديد",
    type: DiscountType.FIXED_AMOUNT,
    value: 15_000,
    scope: DiscountScope.PRODUCT,
    maxInvoiceValue: 200_000,
    maxUses: 50,
    startDateOffsetDays: -60,
    endDateOffsetDays: 30,
    isActive: true,
    productId: 26,
    categoryId: null,
    customerId: null,
  },
  {
    id: 7,
    name: "Fruit Basket Promo",
    nameAr: "عرض سلة الفواكه",
    type: DiscountType.PERCENTAGE,
    value: 15,
    scope: DiscountScope.PRODUCT,
    maxInvoiceValue: 120_000,
    maxUses: 80,
    startDateOffsetDays: -45,
    endDateOffsetDays: 15,
    isActive: true,
    productId: 5,
    categoryId: null,
    customerId: null,
  },
  {
    id: 8,
    name: "VIP Customer Reward",
    nameAr: "مكافأة العملاء المميزين",
    type: DiscountType.PERCENTAGE,
    value: 10,
    scope: DiscountScope.CUSTOMER,
    maxInvoiceValue: 500_000,
    maxUses: null,
    startDateOffsetDays: -75,
    endDateOffsetDays: null,
    isActive: true,
    productId: null,
    categoryId: null,
    customerId: 6,
  },
  {
    id: 9,
    name: "Welcome Gift",
    nameAr: "هدية ترحيبية",
    type: DiscountType.FIXED_AMOUNT,
    value: 20_000,
    scope: DiscountScope.CUSTOMER,
    maxInvoiceValue: 100_000,
    maxUses: 1,
    startDateOffsetDays: -40,
    endDateOffsetDays: 50,
    isActive: true,
    productId: null,
    categoryId: null,
    customerId: 9,
  },
  {
    id: 10,
    name: "Anniversary Sale",
    nameAr: "عرض الذكرى السنوية",
    type: DiscountType.PERCENTAGE,
    value: 30,
    scope: DiscountScope.GLOBAL,
    maxInvoiceValue: 600_000,
    maxUses: 1000,
    startDateOffsetDays: -330,
    endDateOffsetDays: -270,
    isActive: false,
    productId: null,
    categoryId: null,
    customerId: null,
  },
  {
    id: 11,
    name: "Clean Home Deal",
    nameAr: "عرض المنزل النظيف",
    type: DiscountType.FIXED_AMOUNT,
    value: 10_000,
    scope: DiscountScope.CATEGORY,
    maxInvoiceValue: 100_000,
    maxUses: 150,
    startDateOffsetDays: -100,
    endDateOffsetDays: 80,
    isActive: true,
    productId: null,
    categoryId: 8,
    customerId: null,
  },
  {
    id: 12,
    name: "Snacks Fest",
    nameAr: "مهرجان السناكس",
    type: DiscountType.PERCENTAGE,
    value: 12,
    scope: DiscountScope.CATEGORY,
    maxInvoiceValue: 120_000,
    maxUses: 250,
    startDateOffsetDays: -55,
    endDateOffsetDays: 25,
    isActive: true,
    productId: null,
    categoryId: 7,
    customerId: null,
  },
];

export function discountById(id: number): DiscountRule {
  return DISCOUNT_RULES[id - 1]!;
}

export function discountDate(rule: DiscountRule, now: Date, field: "start" | "end"): Date | null {
  if (field === "end") {
    return rule.endDateOffsetDays === null
      ? null
      : new Date(now.getTime() + rule.endDateOffsetDays * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getTime() + rule.startDateOffsetDays * 24 * 60 * 60 * 1000);
}

export interface CartContext {
  categoryIds: Set<number>;
  productIds: Set<number>;
  customerId: number | null;
}

export function applicableDiscounts(cart: CartContext): DiscountRule[] {
  return DISCOUNT_RULES.filter((rule) => {
    if (!rule.isActive) return false;
    switch (rule.scope) {
      case DiscountScope.GLOBAL:
        return true;
      case DiscountScope.CATEGORY:
        return rule.categoryId !== null && cart.categoryIds.has(rule.categoryId);
      case DiscountScope.PRODUCT:
        return rule.productId !== null && cart.productIds.has(rule.productId);
      case DiscountScope.CUSTOMER:
        return rule.customerId !== null && rule.customerId === cart.customerId;
    }
  });
}

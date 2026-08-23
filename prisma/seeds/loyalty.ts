import { DiscountScope, DiscountType, InvoiceStatus } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { deliveredSpendByCustomer } from "./orders";
import { SALES_INVOICES } from "./sales";
import { CUSTOMERS } from "./customers";

export const LOYALTY_POLICY = {
  id: 1,
  pointsPerCurrency: "0.0010",
  currencyPerPoint: "1.0000",
};

export const loyaltyOffersData = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "10% Off Next Purchase",
    nameAr: "خصم 10% على عملية الشراء التالية",
    description: "Redeem 600 points for a 10% discount on your next order.",
    descriptionAr: "استبدل 600 نقطة بخصم 10% على طلبك القادم.",
    pointsCost: 600,
    discountType: DiscountType.PERCENTAGE,
    discountValue: "10.00",
    maxUses: 1,
    validityDays: 14,
    isActive: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "SYP 50,000 Voucher",
    nameAr: "قسيمة بقيمة 50,000 ليرة سورية",
    description: "Redeem 1,200 points for an SYP 50,000 voucher on your next order.",
    descriptionAr: "استبدل 1,200 نقطة بقسيمة بقيمة 50,000 ليرة سورية على طلبك القادم.",
    pointsCost: 1200,
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: "50.00",
    maxUses: 2,
    validityDays: 30,
    isActive: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Free Delivery",
    nameAr: "توصيل مجاني",
    description: "Redeem 300 points and enjoy free delivery on your next order.",
    descriptionAr: "استبدل 300 نقطة واستمتع بتوصيل مجاني لطلبك القادم.",
    pointsCost: 300,
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: "45000.00",
    maxUses: 3,
    validityDays: 21,
    isActive: true,
  },
];

interface RedemptionPlan {
  customerId: number;
  offerId: string;
  offerIndex: number;
  pointsSpent: number;
  redeemedDaysAgo: number;
}

const REDEMPTION_PLANS: RedemptionPlan[] = [
  {
    customerId: 6,
    offerId: "00000000-0000-0000-0000-000000000001",
    offerIndex: 0,
    pointsSpent: 600,
    redeemedDaysAgo: 10,
  },
  {
    customerId: 9,
    offerId: "00000000-0000-0000-0000-000000000003",
    offerIndex: 2,
    pointsSpent: 300,
    redeemedDaysAgo: 5,
  },
];

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function customerTotalSpent(): Map<number, number> {
  const totals = new Map<number, number>();

  for (const [customerId, spend] of deliveredSpendByCustomer) {
    totals.set(customerId, (totals.get(customerId) ?? 0) + spend);
  }

  for (const invoice of SALES_INVOICES) {
    const customerId = invoice.customerId;
    if (customerId == null || invoice.status !== InvoiceStatus.COMPLETED) continue;
    totals.set(customerId, (totals.get(customerId) ?? 0) + Number(invoice.total));
  }

  for (const customer of CUSTOMERS) {
    if (!totals.has(customer.id)) totals.set(customer.id, 0);
  }

  return totals;
}

export async function seedLoyalty(tx: PrismaTransactionClient) {
  await tx.loyaltyPolicy.create({ data: LOYALTY_POLICY });

  for (const offer of loyaltyOffersData) {
    await tx.loyaltyDiscountOffer.create({ data: offer });
  }

  const totals = customerTotalSpent();
  const redeemedPointsByCustomer = new Map<number, number>();

  for (const [index, plan] of REDEMPTION_PLANS.entries()) {
    const offer = loyaltyOffersData[plan.offerIndex]!;
    const redeemedAt = daysAgo(plan.redeemedDaysAgo);
    const expiresAt = new Date(redeemedAt.getTime() + offer.validityDays * 24 * 60 * 60 * 1000);

    const discount = await tx.discount.create({
      data: {
        id: 13 + index,
        name: `Loyalty Reward - ${offer.name}`,
        nameAr: `مكافأة الولاء - ${offer.nameAr}`,
        type: offer.discountType,
        value: offer.discountValue,
        scope: DiscountScope.CUSTOMER,
        maxInvoiceValue: offer.discountType === DiscountType.FIXED_AMOUNT ? offer.discountValue : "500000.00",
        maxUses: 1,
        usedCount: 0,
        startDate: redeemedAt,
        endDate: expiresAt,
        isActive: true,
        createdById: 1,
        productId: null,
        categoryId: null,
        customerId: plan.customerId,
      },
    });

    await tx.loyaltyRedemption.create({
      data: {
        id: `00000000-0000-0000-0000-00000000000${index + 1}`,
        customerId: plan.customerId,
        offerId: plan.offerId,
        discountId: discount.id,
        pointsSpent: plan.pointsSpent,
        redeemedAt,
      },
    });

    redeemedPointsByCustomer.set(plan.customerId, plan.pointsSpent);
  }

  for (const [customerId, totalSpent] of totals) {
    const earned = Math.floor(totalSpent * Number(LOYALTY_POLICY.pointsPerCurrency));
    const redeemed = redeemedPointsByCustomer.get(customerId) ?? 0;
    await tx.customer.update({
      where: { id: customerId },
      data: { totalSpent: String(totalSpent.toFixed(2)), loyaltyPoints: earned - redeemed },
    });
  }
}

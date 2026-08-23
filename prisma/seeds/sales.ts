import { InvoiceStatus, type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import {
  computeDiscountAmount,
  pick,
  randInt,
  randomOrderDate,
  random,
  round,
  weightedRandomIndex,
} from "./data/generators";
import { applicableDiscounts } from "./data/discount-rules";
import { PRODUCTS, productById } from "./data/catalog";
import { CASHIER_EMPLOYEE_IDS } from "./staff";
import { CUSTOMERS } from "./customers";

const SALES_COUNT = 320;

interface PlannedItem {
  productId: number;
  quantity: number;
}

interface PlannedSale {
  invoiceDate: Date;
  cashierId: number;
  customerId: number | null;
  appliedDiscountId: number | null;
  discountAmount: number;
  status: InvoiceStatus;
  items: PlannedItem[];
}

function quantityFor(sellingPrice: number): number {
  if (sellingPrice > 60_000) return randInt(1, 2);
  if (sellingPrice > 10_000) return randInt(1, 4);
  return randInt(1, 6);
}

function planSales(): PlannedSale[] {
  const now = new Date();

  const planned: PlannedSale[] = [];
  for (let i = 0; i < SALES_COUNT; i++) {
    const itemCount = randInt(2, 6);
    const usedProductIds = new Set<number>();
    const items: PlannedItem[] = [];
    const categoryIds = new Set<number>();

    while (items.length < itemCount) {
      const product = pick(PRODUCTS);
      if (usedProductIds.has(product.id)) continue;
      usedProductIds.add(product.id);
      categoryIds.add(product.categoryId);
      items.push({ productId: product.id, quantity: quantityFor(product.sellingPrice) });
    }

    const hasCustomer = random() > 0.45;
    const customerId = hasCustomer ? pick(CUSTOMERS).id : null;

    let appliedDiscountId: number | null = null;
    let discountAmount = 0;
    const subtotal = items.reduce((sum, item) => sum + item.quantity * productById(item.productId).sellingPrice, 0);

    if (random() < 0.25 && subtotal > 0) {
      const candidates = applicableDiscounts({
        categoryIds,
        productIds: usedProductIds,
        customerId,
      });
      if (candidates.length > 0) {
        const rule = pick(candidates);
        appliedDiscountId = rule.id;
        discountAmount = computeDiscountAmount(rule, subtotal);
      }
    }

    const statusRoll = weightedRandomIndex([82, 6, 7, 5]);
    const status =
      statusRoll === 0
        ? InvoiceStatus.COMPLETED
        : statusRoll === 1
          ? InvoiceStatus.PENDING
          : statusRoll === 2
            ? InvoiceStatus.REFUNDED
            : InvoiceStatus.CANCELLED;

    planned.push({
      invoiceDate: randomOrderDate(now),
      cashierId: pick(CASHIER_EMPLOYEE_IDS),
      customerId,
      appliedDiscountId,
      discountAmount,
      status,
      items,
    });
  }

  return planned.sort((a, b) => a.invoiceDate.getTime() - b.invoiceDate.getTime());
}

const plannedSales = planSales();

export const SALES_INVOICES: Prisma.SalesInvoiceCreateManyInput[] = plannedSales.map((sale, idx) => {
  const subtotal = round(
    sale.items.reduce((sum, item) => sum + item.quantity * productById(item.productId).sellingPrice, 0),
  );
  return {
    id: idx + 1,
    cashierId: sale.cashierId,
    customerId: sale.customerId,
    appliedDiscountId: sale.appliedDiscountId,
    subtotal: String(subtotal),
    discountAmount: String(sale.discountAmount),
    total: String(round(subtotal - sale.discountAmount)),
    status: sale.status,
    createdAt: sale.invoiceDate,
  };
});

export const SALE_ITEMS: Prisma.SaleItemCreateManyInput[] = (() => {
  const items: Prisma.SaleItemCreateManyInput[] = [];
  let itemId = 0;

  plannedSales.forEach((sale, idx) => {
    for (const item of sale.items) {
      itemId++;
      const unitPrice = productById(item.productId).sellingPrice;
      items.push({
        id: itemId,
        invoiceId: idx + 1,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: String(unitPrice),
        discount: "0",
        subtotal: String(item.quantity * unitPrice),
      });
    }
  });

  return items;
})();

export const soldQtyByProduct: Map<number, number> = (() => {
  const totals = new Map<number, number>();
  for (const sale of plannedSales) {
    if (sale.status !== InvoiceStatus.COMPLETED && sale.status !== InvoiceStatus.PENDING) continue;
    for (const item of sale.items) {
      totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
    }
  }
  return totals;
})();

export const discountUsageFromSales: Record<number, number> = plannedSales.reduce<Record<number, number>>(
  (acc, sale) => {
    if (sale.appliedDiscountId !== null) {
      acc[sale.appliedDiscountId] = (acc[sale.appliedDiscountId] ?? 0) + 1;
    }
    return acc;
  },
  {},
);

export async function seedSales(tx: PrismaTransactionClient) {
  await tx.salesInvoice.createMany({ data: SALES_INVOICES });
  await tx.saleItem.createMany({ data: SALE_ITEMS });
}

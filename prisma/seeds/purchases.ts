import { InvoiceStatus, type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { randInt, random, randomDate } from "./data/generators";
import { PRODUCTS, productsBySupplier, restockQuantity, type CatalogProduct } from "./data/catalog";
import { SUPPLIER_COUNT } from "./suppliers";
import { ACCOUNTANT_EMPLOYEE_ID } from "./staff";
import { soldQtyByProduct } from "./sales";
import { orderedQtyByProduct } from "./orders";

const PERISHABLE_CATEGORY_IDS = new Set([1, 2, 3, 4]);

interface PlannedInvoice {
  supplierId: number;
  invoiceDate: Date;
  items: { productId: number; quantity: number }[];
}

function productById(productId: number) {
  return PRODUCTS[productId - 1]!;
}

function planPurchases(): PlannedInvoice[] {
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const queues = new Map<number, CatalogProduct[]>();
  for (let supplierId = 1; supplierId <= SUPPLIER_COUNT; supplierId++) {
    queues.set(
      supplierId,
      [...productsBySupplier(supplierId)].sort(() => random() - 0.5),
    );
  }

  const planned: PlannedInvoice[] = [];
  let cursor = 0;
  let remaining = PRODUCTS.length;

  while (remaining > 0) {
    const supplierId = (cursor % SUPPLIER_COUNT) + 1;
    cursor++;
    const queue = queues.get(supplierId)!;
    if (queue.length === 0) continue;

    const take = Math.min(queue.length, randInt(2, 4));
    const items = queue.splice(0, take).map((p) => {
      const demanded = (soldQtyByProduct.get(p.id) ?? 0) + (orderedQtyByProduct.get(p.id) ?? 0);
      return { productId: p.id, quantity: restockQuantity(p.id, demanded) };
    });
    remaining -= items.length;
    planned.push({ supplierId, invoiceDate: randomDate(start, now), items });
  }

  return planned.sort((a, b) => a.invoiceDate.getTime() - b.invoiceDate.getTime());
}

const plannedInvoices = planPurchases();

export const purchasedQtyByProduct: Map<number, number> = (() => {
  const totals = new Map<number, number>();
  for (const invoice of plannedInvoices) {
    for (const item of invoice.items) {
      totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
    }
  }
  return totals;
})();

export const PURCHASE_INVOICES: Prisma.PurchaseInvoiceCreateManyInput[] = plannedInvoices.map((invoice, idx) => ({
  id: idx + 1,
  supplierId: invoice.supplierId,
  accountantId: ACCOUNTANT_EMPLOYEE_ID,
  total: String(
    invoice.items.reduce((sum, item) => sum + item.quantity * productById(item.productId).purchasePrice, 0),
  ),
  status: idx >= plannedInvoices.length - 2 ? InvoiceStatus.PENDING : InvoiceStatus.COMPLETED,
  invoiceDate: invoice.invoiceDate,
}));

export const PURCHASE_ITEMS: Prisma.PurchaseItemCreateManyInput[] = (() => {
  const items: Prisma.PurchaseItemCreateManyInput[] = [];
  let itemId = 0;

  plannedInvoices.forEach((invoice, idx) => {
    for (const item of invoice.items) {
      itemId++;
      const product = productById(item.productId);
      const expiry = PERISHABLE_CATEGORY_IDS.has(product.categoryId)
        ? randomDate(invoice.invoiceDate, new Date(invoice.invoiceDate.getTime() + 365 * 24 * 60 * 60 * 1000))
        : null;

      items.push({
        id: itemId,
        purchaseId: idx + 1,
        productId: item.productId,
        quantity: item.quantity,
        unitCost: String(product.purchasePrice),
        subtotal: String(item.quantity * product.purchasePrice),
        expiryDate: expiry,
      });
    }
  });

  return items;
})();

export async function seedPurchases(tx: PrismaTransactionClient) {
  await tx.purchaseInvoice.createMany({ data: PURCHASE_INVOICES });
  await tx.purchaseItem.createMany({ data: PURCHASE_ITEMS });
}

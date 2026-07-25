import { InvoiceStatus, type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { pick, randFloat, randInt, randomDate, round } from "./data/generators";
import { SUPPLIER_COUNT } from "./suppliers";
import { PRODUCT_COUNT } from "./products";

const PURCHASE_COUNT = 150;
const ACCOUNTANT_IDS = [8, 9];

export async function seedPurchases(tx: PrismaTransactionClient) {
  const now = new Date();
  const startDate = new Date(now.getFullYear() - 1, 0, 1);
  const endDate = now;

  const allInvoices: Prisma.PurchaseInvoiceCreateManyInput[] = [];
  const allItems: Prisma.PurchaseItemCreateManyInput[] = [];
  let itemId = 0;

  for (let i = 0; i < PURCHASE_COUNT; i++) {
    const itemCount = randInt(1, 5);
    const invoiceDate = randomDate(startDate, endDate);
    const accountantId = pick(ACCOUNTANT_IDS);
    const invoiceId = i + 1;

    const usedProductIds = new Set<number>();
    let total = 0;

    for (let j = 0; j < itemCount; j++) {
      let productId: number;
      do {
        productId = randInt(1, PRODUCT_COUNT);
      } while (usedProductIds.has(productId));
      usedProductIds.add(productId);

      itemId++;
      const quantity = randInt(10, 500);
      const unitCost = randFloat(1, 200, 2);
      const subtotal = round(quantity * unitCost);
      total += subtotal;

      allItems.push({
        id: itemId,
        purchaseId: invoiceId,
        productId,
        quantity,
        unitCost: String(unitCost),
        subtotal: String(subtotal),
        expiryDate:
          Math.random() > 0.5
            ? randomDate(
                invoiceDate,
                new Date(invoiceDate.getFullYear() + 1, invoiceDate.getMonth(), invoiceDate.getDate()),
              )
            : null,
      });
    }

    allInvoices.push({
      id: invoiceId,
      supplierId: randInt(1, SUPPLIER_COUNT),
      accountantId,
      total: String(round(total)),
      status: pick([InvoiceStatus.COMPLETED, InvoiceStatus.PENDING, InvoiceStatus.COMPLETED, InvoiceStatus.COMPLETED]),
      invoiceDate,
    });
  }

  await tx.purchaseInvoice.createMany({ data: allInvoices });
  await tx.purchaseItem.createMany({ data: allItems });
}

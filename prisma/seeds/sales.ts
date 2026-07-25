import { InvoiceStatus, type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { pick, randFloat, randInt, randomDate, round } from "./data/generators";
import { PRODUCT_COUNT } from "./products";
import { CUSTOMER_COUNT, CUSTOMER_ID_OFFSET } from "./customers";

const SALES_COUNT = 800;
const CASHIER_IDS = [3, 4, 5, 6, 7];

export async function seedSales(tx: PrismaTransactionClient) {
  const now = new Date();
  const startDate = new Date(now.getFullYear() - 1, 0, 1);

  const allInvoices: Prisma.SalesInvoiceCreateManyInput[] = [];
  const allItems: Prisma.SaleItemCreateManyInput[] = [];
  let itemId = 0;

  for (let i = 0; i < SALES_COUNT; i++) {
    const itemCount = randInt(1, 8);
    const invoiceDate = randomDate(startDate, now);
    const cashierId = pick(CASHIER_IDS);
    const hasCustomer = Math.random() > 0.3;
    const customerId = hasCustomer ? randInt(CUSTOMER_ID_OFFSET, CUSTOMER_ID_OFFSET + CUSTOMER_COUNT - 1) : null;
    const discountId = i < 40 ? i + 1 : null;
    const invoiceId = i + 1;

    const usedProductIds = new Set<number>();
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      let productId: number;
      do {
        productId = randInt(1, PRODUCT_COUNT);
      } while (usedProductIds.has(productId));
      usedProductIds.add(productId);

      itemId++;
      const quantity = randInt(1, 5);
      const unitPrice = randFloat(1, 500, 2);
      const discount = Math.random() > 0.8 ? randFloat(0, unitPrice * 0.3, 2) : 0;
      const itemSubtotal = round(quantity * unitPrice - discount);
      subtotal += quantity * unitPrice;

      allItems.push({
        id: itemId,
        invoiceId,
        productId,
        quantity,
        unitPrice: String(unitPrice),
        discount: String(discount),
        subtotal: String(itemSubtotal),
      });
    }

    const discountAmount = discountId ? round(subtotal * 0.1) : 0;
    const total = round(subtotal - discountAmount);

    allInvoices.push({
      id: invoiceId,
      cashierId,
      customerId,
      appliedDiscountId: discountId,
      subtotal: String(round(subtotal)),
      discountAmount: String(discountAmount),
      total: String(total),
      status: pick([
        InvoiceStatus.COMPLETED,
        InvoiceStatus.COMPLETED,
        InvoiceStatus.COMPLETED,
        InvoiceStatus.PENDING,
        InvoiceStatus.CANCELLED,
        InvoiceStatus.REFUNDED,
      ]),
      createdAt: invoiceDate,
    });
  }

  await tx.salesInvoice.createMany({ data: allInvoices });
  await tx.saleItem.createMany({ data: allItems });
}

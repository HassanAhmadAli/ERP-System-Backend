import { InvoiceStatus } from "@/prisma";
import { prisma } from "./client-instance";

export async function seedPurchases() {
  await prisma.purchaseInvoice.create({
    data: {
      id: 1,
      supplierId: 1,
      accountantId: 1,
      total: "150.00",
      status: InvoiceStatus.COMPLETED,
      invoiceDate: new Date("2025-03-01T10:00:00.000Z"),
      items: {
        create: [
          {
            id: 1,
            productId: 1,
            quantity: 10,
            unitCost: "15.00",
            subtotal: "150.00",
          },
        ],
      },
    },
  });

  await prisma.purchaseInvoice.create({
    data: {
      id: 2,
      supplierId: 2,
      accountantId: 3,
      total: "250.00",
      status: InvoiceStatus.PENDING,
      invoiceDate: new Date("2025-04-15T09:00:00.000Z"),
      items: {
        create: [
          {
            id: 2,
            productId: 2,
            quantity: 100,
            unitCost: "2.50",
            subtotal: "250.00",
          },
        ],
      },
    },
  });
}

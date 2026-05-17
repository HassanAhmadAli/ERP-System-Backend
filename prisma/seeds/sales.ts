import { InvoiceStatus } from "@/prisma";
import { prisma } from "./client-instance";

export async function seedSales() {
  await prisma.salesInvoice.create({
    data: {
      id: 1,
      cashierId: 2,
      customerId: 1,
      appliedDiscountId: 1,
      subtotal: "29.99",
      discountAmount: "3.00",
      total: "26.99",
      amountPaid: "26.99",
      status: InvoiceStatus.COMPLETED,
      createdAt: new Date("2025-04-01T14:30:00.000Z"),
      items: {
        create: [
          {
            id: 1,
            productId: 1,
            quantity: 1,
            unitPrice: "29.99",
            discount: "3.00",
            subtotal: "26.99",
          },
        ],
      },
    },
  });

  await prisma.salesInvoice.create({
    data: {
      id: 2,
      cashierId: 2,
      customerId: null,
      appliedDiscountId: null,
      subtotal: "9.98",
      discountAmount: "0.00",
      total: "9.98",
      amountPaid: "0.00",
      status: InvoiceStatus.PENDING,
      createdAt: new Date("2025-04-20T11:00:00.000Z"),
      items: {
        create: [
          {
            id: 2,
            productId: 2,
            quantity: 2,
            unitPrice: "4.99",
            discount: "0.00",
            subtotal: "9.98",
          },
        ],
      },
    },
  });
}

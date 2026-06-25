import { InvoiceStatus } from "@/prisma/client";
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

  await prisma.salesInvoice.create({
    data: {
      id: 3,
      cashierId: 5,
      customerId: 1,
      appliedDiscountId: null,
      subtotal: "4.99",
      discountAmount: "0.00",
      total: "4.99",
      status: InvoiceStatus.REFUNDED,
      createdAt: new Date("2025-04-19T15:00:00.000Z"),
      items: {
        create: [
          {
            id: 3,
            productId: 2,
            quantity: 1,
            unitPrice: "4.99",
            discount: "0.00",
            subtotal: "4.99",
          },
        ],
      },
    },
  });
}

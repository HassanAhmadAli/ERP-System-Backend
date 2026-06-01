import { OrderStatus } from "@/prisma";
import { prisma } from "./client-instance";

export async function seedOrders() {
  await prisma.order.create({
    data: {
      id: 1,
      customerId: 1,
      appliedDiscountId: 2,
      subtotal: "9.98",
      discountAmount: "5.00",
      total: "4.98",
      loyaltyPointsUsed: 0,
      deliveryAddress: "123 Main St, Springfield",
      status: OrderStatus.DELIVERED,
      createdAt: new Date("2025-04-10T16:00:00.000Z"),
      items: {
        create: [
          {
            id: 1,
            productId: 2,
            quantity: 2,
            unitPrice: "4.99",
            subtotal: "9.98",
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: 2,
      customerId: 1,
      appliedDiscountId: null,
      subtotal: "29.99",
      discountAmount: "0.00",
      total: "29.99",
      loyaltyPointsUsed: 50,
      deliveryAddress: "123 Main St, Springfield",
      status: OrderStatus.PREPARING,
      createdAt: new Date("2025-04-21T08:00:00.000Z"),
      items: {
        create: [
          {
            id: 2,
            productId: 1,
            quantity: 1,
            unitPrice: "29.99",
            subtotal: "29.99",
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: 3,
      customerId: 1,
      appliedDiscountId: null,
      subtotal: "14.97",
      discountAmount: "0.00",
      total: "14.97",
      loyaltyPointsUsed: 0,
      deliveryAddress: "123 Main St, Springfield",
      status: OrderStatus.PENDING,
      createdAt: new Date("2025-04-22T09:00:00.000Z"),
      items: {
        create: [
          {
            id: 3,
            productId: 2,
            quantity: 3,
            unitPrice: "4.99",
            subtotal: "14.97",
          },
        ],
      },
    },
  });
}

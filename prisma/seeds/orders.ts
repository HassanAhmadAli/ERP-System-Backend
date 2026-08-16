import { OrderStatus, type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { randInt, randomOrderDate, round } from "./data/generators";
import { PRODUCT_COUNT } from "./products";
import { CUSTOMER_COUNT, CUSTOMER_ID_OFFSET } from "./customers";

const ORDER_COUNT = 6000;

const STATUS_WEIGHT = [
  { status: OrderStatus.DELIVERED, weight: 65 },
  { status: OrderStatus.CANCELLED, weight: 10 },
  { status: OrderStatus.OUT_FOR_DELIVERY, weight: 10 },
  { status: OrderStatus.PREPARING, weight: 8 },
  { status: OrderStatus.PENDING, weight: 7 },
];

function pickStatus(): OrderStatus {
  const total = STATUS_WEIGHT.reduce((a, s) => a + s.weight, 0);
  let r = Math.random() * total;
  for (const s of STATUS_WEIGHT) {
    r -= s.weight;
    if (r <= 0) return s.status;
  }
  return OrderStatus.DELIVERED;
}

export async function seedOrders(tx: PrismaTransactionClient) {
  const now = new Date();

  const orders: Prisma.OrderCreateManyInput[] = [];
  const orderItems: Prisma.OrderItemCreateManyInput[] = [];
  const customerTotals: Record<number, number> = {};

  let itemId = 0;

  for (let i = 0; i < ORDER_COUNT; i++) {
    const status = pickStatus();
    const createdAt = randomOrderDate(now);
    const itemCount = randInt(1, 6);
    const customerId = randInt(CUSTOMER_ID_OFFSET, CUSTOMER_ID_OFFSET + CUSTOMER_COUNT - 1);
    const useDiscount = Math.random() > 0.85;
    const discountId = useDiscount ? randInt(1, 40) : null;

    let subtotal = 0;
    const usedProductIds = new Set<number>();

    for (let j = 0; j < itemCount; j++) {
      let productId: number;
      do {
        productId = randInt(1, PRODUCT_COUNT);
      } while (usedProductIds.has(productId));
      usedProductIds.add(productId);

      itemId++;
      const quantity = randInt(1, 4);
      const unitPrice = parseFloat((Math.random() * (status === OrderStatus.DELIVERED ? 50 : 200) + 2).toFixed(2));
      const itemSubtotal = round(quantity * unitPrice);
      subtotal += itemSubtotal;

      orderItems.push({
        id: itemId,
        orderId: i + 1,
        productId,
        quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    customerTotals[customerId] = (customerTotals[customerId] ?? 0) + subtotal;

    const discountAmount = useDiscount ? round(subtotal * 0.1) : 0;

    orders.push({
      id: i + 1,
      customerId,
      appliedDiscountId: discountId,
      subtotal: round(subtotal),
      discountAmount,
      total: round(subtotal - discountAmount),
      deliveryAddress: null,
      deliveryAddressAr: null,
      status,
      createdAt,
      updatedAt: createdAt,
    });
  }

  await tx.order.createMany({ data: orders });
  await tx.orderItem.createMany({ data: orderItems });

  for (const [customerIdStr, totalSpent] of Object.entries(customerTotals)) {
    const customerId = Number(customerIdStr);
    await tx.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: round(totalSpent),
        loyaltyPoints: Math.floor(totalSpent / 10),
      },
    });
  }
}

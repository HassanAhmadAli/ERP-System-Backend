import { OrderStatus, type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { computeDiscountAmount } from "./data/generators";
import { discountById } from "./data/discount-rules";
import { productById } from "./data/catalog";
import { CUSTOMERS } from "./customers";

interface OrderSpec {
  daysAgo: number;
  hour: number;
  minute: number;
  customerId: number;
  status: OrderStatus;
  items: readonly [number, number][];
  discountId?: number;
}

const ORDER_SPECS: OrderSpec[] = [
  {
    daysAgo: 75,
    hour: 14,
    minute: 30,
    customerId: 6,
    status: OrderStatus.DELIVERED,
    items: [
      [1, 1],
      [5, 2],
    ],
    discountId: 6,
  },
  {
    daysAgo: 68,
    hour: 11,
    minute: 15,
    customerId: 9,
    status: OrderStatus.DELIVERED,
    items: [
      [3, 1],
      [4, 1],
    ],
    discountId: 7,
  },
  {
    daysAgo: 61,
    hour: 16,
    minute: 45,
    customerId: 8,
    status: OrderStatus.DELIVERED,
    items: [
      [11, 1],
      [15, 1],
    ],
    discountId: 11,
  },
  {
    daysAgo: 56,
    hour: 12,
    minute: 20,
    customerId: 7,
    status: OrderStatus.DELIVERED,
    items: [
      [6, 3],
      [8, 1],
    ],
    discountId: 4,
  },
  {
    daysAgo: 49,
    hour: 10,
    minute: 5,
    customerId: 10,
    status: OrderStatus.DELIVERED,
    items: [
      [16, 2],
      [18, 3],
      [19, 4],
    ],
  },
  {
    daysAgo: 42,
    hour: 13,
    minute: 40,
    customerId: 11,
    status: OrderStatus.DELIVERED,
    items: [
      [7, 1],
      [9, 1],
    ],
  },
  {
    daysAgo: 38,
    hour: 17,
    minute: 10,
    customerId: 12,
    status: OrderStatus.DELIVERED,
    items: [
      [30, 1],
      [29, 2],
    ],
  },
  {
    daysAgo: 33,
    hour: 15,
    minute: 0,
    customerId: 6,
    status: OrderStatus.CANCELLED,
    items: [[34, 1]],
  },
  {
    daysAgo: 28,
    hour: 11,
    minute: 50,
    customerId: 13,
    status: OrderStatus.DELIVERED,
    items: [
      [31, 2],
      [35, 3],
      [33, 1],
    ],
    discountId: 12,
  },
  {
    daysAgo: 24,
    hour: 14,
    minute: 55,
    customerId: 9,
    status: OrderStatus.DELIVERED,
    items: [
      [2, 1],
      [5, 1],
    ],
    discountId: 3,
  },
  {
    daysAgo: 20,
    hour: 10,
    minute: 30,
    customerId: 8,
    status: OrderStatus.DELIVERED,
    items: [
      [14, 2],
      [12, 1],
    ],
  },
  {
    daysAgo: 17,
    hour: 18,
    minute: 25,
    customerId: 7,
    status: OrderStatus.DELIVERED,
    items: [
      [10, 2],
      [6, 1],
    ],
  },
  {
    daysAgo: 14,
    hour: 12,
    minute: 0,
    customerId: 10,
    status: OrderStatus.DELIVERED,
    items: [
      [17, 2],
      [20, 2],
    ],
    discountId: 5,
  },
  {
    daysAgo: 11,
    hour: 15,
    minute: 35,
    customerId: 11,
    status: OrderStatus.DELIVERED,
    items: [
      [23, 1],
      [21, 2],
    ],
  },
  {
    daysAgo: 8,
    hour: 13,
    minute: 5,
    customerId: 12,
    status: OrderStatus.DELIVERED,
    items: [
      [26, 1],
      [27, 1],
    ],
    discountId: 2,
  },
  {
    daysAgo: 6,
    hour: 9,
    minute: 45,
    customerId: 13,
    status: OrderStatus.DELIVERED,
    items: [
      [36, 1],
      [40, 2],
      [38, 2],
    ],
  },
  {
    daysAgo: 4,
    hour: 16,
    minute: 20,
    customerId: 6,
    status: OrderStatus.DELIVERED,
    items: [[28, 1]],
    discountId: 8,
  },
  {
    daysAgo: 2,
    hour: 11,
    minute: 30,
    customerId: 8,
    status: OrderStatus.OUT_FOR_DELIVERY,
    items: [
      [13, 4],
      [12, 1],
    ],
  },
  {
    daysAgo: 1,
    hour: 14,
    minute: 10,
    customerId: 9,
    status: OrderStatus.PREPARING,
    items: [
      [25, 1],
      [22, 2],
    ],
  },
  {
    daysAgo: 0,
    hour: 9,
    minute: 30,
    customerId: 10,
    status: OrderStatus.PENDING,
    items: [
      [24, 1],
      [18, 2],
    ],
  },
];

function specDate(spec: OrderSpec): Date {
  const date = new Date();
  date.setDate(date.getDate() - spec.daysAgo);
  date.setHours(spec.hour, spec.minute, 0, 0);
  return date;
}

function updatedAtFor(status: OrderStatus, createdAt: Date): Date {
  const date = new Date(createdAt.getTime());
  switch (status) {
    case OrderStatus.DELIVERED:
      date.setDate(date.getDate() + 2);
      break;
    case OrderStatus.OUT_FOR_DELIVERY:
      date.setHours(date.getHours() + 8);
      break;
    case OrderStatus.PREPARING:
      date.setHours(date.getHours() + 5);
      break;
    case OrderStatus.PENDING:
      date.setMinutes(date.getMinutes() + 30);
      break;
    case OrderStatus.CANCELLED:
      date.setHours(date.getHours() + 6);
      break;
  }
  return date;
}

function customerById(id: number) {
  return CUSTOMERS.find((c) => c.id === id)!;
}

export const ORDERS: Prisma.OrderCreateManyInput[] = ORDER_SPECS.map((spec, idx) => {
  const createdAt = specDate(spec);
  const roundedSubtotal = parseFloat(
    spec.items
      .reduce((sum, [productId, quantity]) => sum + quantity * productById(productId).sellingPrice, 0)
      .toFixed(2),
  );

  const rule = spec.discountId ? discountById(spec.discountId) : null;
  const discountAmount = rule ? computeDiscountAmount(rule, roundedSubtotal) : 0;
  const customer = customerById(spec.customerId);

  return {
    id: idx + 1,
    customerId: spec.customerId,
    appliedDiscountId: spec.discountId ?? null,
    subtotal: String(roundedSubtotal),
    discountAmount: String(discountAmount),
    total: String(parseFloat((roundedSubtotal - discountAmount).toFixed(2))),
    deliveryAddress: customer.address,
    deliveryAddressAr: customer.addressAr,
    status: spec.status,
    createdAt,
    updatedAt: updatedAtFor(spec.status, createdAt),
  };
});

export const ORDER_ITEMS: Prisma.OrderItemCreateManyInput[] = (() => {
  const items: Prisma.OrderItemCreateManyInput[] = [];
  let itemId = 0;

  ORDER_SPECS.forEach((spec, idx) => {
    for (const [productId, quantity] of spec.items) {
      itemId++;
      const unitPrice = productById(productId).sellingPrice;
      items.push({
        id: itemId,
        orderId: idx + 1,
        productId,
        quantity,
        unitPrice: String(unitPrice),
        subtotal: String(quantity * unitPrice),
      });
    }
  });

  return items;
})();

export const orderedQtyByProduct: Map<number, number> = (() => {
  const totals = new Map<number, number>();
  ORDER_SPECS.forEach((spec) => {
    if (spec.status === OrderStatus.CANCELLED) return;
    for (const [productId, quantity] of spec.items) {
      totals.set(productId, (totals.get(productId) ?? 0) + quantity);
    }
  });
  return totals;
})();

export const deliveredSpendByCustomer: Map<number, number> = (() => {
  const totals = new Map<number, number>();
  ORDER_SPECS.forEach((spec, idx) => {
    if (spec.status !== OrderStatus.DELIVERED) return;
    const order = ORDERS[idx]!;
    totals.set(spec.customerId, (totals.get(spec.customerId) ?? 0) + Number(order.total));
  });
  return totals;
})();

export const discountUsageFromOrders: Record<number, number> = Object.fromEntries(
  ORDER_SPECS.filter((spec) => spec.discountId !== undefined).map((spec) => [spec.discountId!, 1]),
);

export async function seedOrders(tx: PrismaTransactionClient) {
  await tx.order.createMany({ data: ORDERS });
  await tx.orderItem.createMany({ data: ORDER_ITEMS });
}

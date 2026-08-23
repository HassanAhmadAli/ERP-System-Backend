import { Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";

function daysAgo(days: number, hour = 10, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export const auditLogsData = [
  {
    id: 1,
    userId: 1,
    action: "CREATE",
    entity: "Product",
    entityId: "1",
    oldValue: Prisma.JsonNull,
    newValue: { name: "Local Tomato (per kg)", barcode: "6220000000001" },
    performedAt: daysAgo(120),
  },
  {
    id: 2,
    userId: 1,
    action: "UPDATE",
    entity: "Product",
    entityId: "1",
    oldValue: { sellingPrice: "7000.00" },
    newValue: { sellingPrice: "7500.00" },
    performedAt: daysAgo(90),
  },
  {
    id: 3,
    userId: 2,
    action: "CREATE",
    entity: "Expense",
    entityId: "7",
    newValue: { description: "POS system annual maintenance", amount: "2400.00" },
    performedAt: daysAgo(260, 11, 30),
  },
  {
    id: 4,
    userId: 1,
    action: "CREATE",
    entity: "Discount",
    entityId: "3",
    newValue: { name: "Tech Days", type: "PERCENTAGE", value: "20" },
    performedAt: daysAgo(30),
  },
  {
    id: 5,
    userId: 5,
    action: "UPDATE",
    entity: "Product",
    entityId: "31",
    oldValue: { quantityInStock: 9 },
    newValue: { quantityInStock: 12 },
    performedAt: daysAgo(20, 14, 15),
  },
  {
    id: 6,
    userId: 1,
    action: "UPDATE",
    entity: "Order",
    entityId: "17",
    oldValue: { status: "OUT_FOR_DELIVERY" },
    newValue: { status: "DELIVERED" },
    performedAt: daysAgo(2, 16, 40),
  },
];

export async function seedAuditLogs(tx: PrismaTransactionClient) {
  await tx.auditLog.createMany({ data: auditLogsData });
}

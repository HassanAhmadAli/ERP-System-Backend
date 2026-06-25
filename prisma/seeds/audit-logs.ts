import { Prisma } from "@/prisma/client";
import { prisma } from "./client-instance";

export const auditLogsData = [
  {
    id: 1,
    userId: 1,
    action: "CREATE",
    entity: "Product",
    entityId: "1",
    oldValue: Prisma.JsonNull,
    newValue: { name: "Wireless Mouse", barcode: "100000000001" },
    performedAt: new Date("2025-01-15T10:00:00.000Z"),
  },
  {
    id: 2,
    userId: 3,
    action: "UPDATE",
    entity: "Order",
    entityId: "2",
    oldValue: { status: "PENDING" },
    newValue: { status: "PREPARING" },
    performedAt: new Date("2025-04-21T08:30:00.000Z"),
  },
];

export async function seedAuditLogs() {
  for (const item of auditLogsData) {
    await prisma.auditLog.create({ data: item });
  }
}

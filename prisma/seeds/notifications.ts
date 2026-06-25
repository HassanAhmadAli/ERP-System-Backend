import { NotificationTargetType, UserRole } from "@/prisma/client";
import { prisma } from "./client-instance";

export async function seedNotifications() {
  await prisma.notification.create({
    data: {
      id: 1,
      senderId: 1,
      title: "Welcome to the store",
      body: "Your account is ready. Browse our latest products.",
      targetType: NotificationTargetType.USER,
      sentAt: new Date("2025-04-01T09:00:00.000Z"),
      recipients: {
        create: [
          {
            id: 1,
            userId: 2,
            isRead: true,
            readAt: new Date("2025-04-01T10:00:00.000Z"),
          },
        ],
      },
    },
  });

  await prisma.notification.create({
    data: {
      id: 2,
      senderId: 1,
      title: "Low stock alert",
      body: "Wireless Mouse is below minimum quantity.",
      targetType: NotificationTargetType.ROLE,
      targetRole: UserRole.WAREHOUSE_WORKER,
      sentAt: new Date("2025-04-20T12:00:00.000Z"),
      recipients: {
        create: [{ id: 2, userId: 4, isRead: false }],
      },
    },
  });

  await prisma.notification.create({
    data: {
      id: 3,
      senderId: 1,
      title: "New discount available",
      body: "Store-wide Spring Sale is now active — 10% off your next order.",
      targetType: NotificationTargetType.USER,
      sentAt: new Date("2025-04-22T10:00:00.000Z"),
      recipients: {
        create: [{ id: 3, userId: 2, isRead: false }],
      },
    },
  });

  await prisma.notification.create({
    data: {
      id: 4,
      senderId: 5,
      title: "Shift reminder",
      body: "Evening shift starts at 4:00 PM. Please sign in at the POS.",
      targetType: NotificationTargetType.ROLE,
      targetRole: UserRole.CASHIER,
      sentAt: new Date("2025-04-22T08:00:00.000Z"),
      recipients: {
        create: [
          { id: 4, userId: 3, isRead: true, readAt: new Date("2025-04-22T08:15:00.000Z") },
          { id: 5, userId: 6, isRead: false },
        ],
      },
    },
  });
}

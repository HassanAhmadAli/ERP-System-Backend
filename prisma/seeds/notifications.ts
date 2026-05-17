import { NotificationTargetType } from "@/prisma";
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
      sentAt: new Date("2025-04-20T12:00:00.000Z"),
      recipients: {
        create: [
          { id: 2, userId: 3, isRead: false },
          { id: 3, userId: 4, isRead: false },
        ],
      },
    },
  });
}

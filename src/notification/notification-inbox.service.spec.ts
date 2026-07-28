import { Test, TestingModule } from "@nestjs/testing";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { NotificationInboxService } from "./notification-inbox.service";

describe("NotificationInboxService", () => {
  let service: NotificationInboxService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;

  const mockRecipient = {
    id: 1,
    userId: 10,
    notificationId: 100,
    isRead: false,
    readAt: null,
    notification: {
      id: 100,
      title: "Test",
      body: "Body",
      sender: { id: 1, fullName: "Admin", fullNameAr: null, email: "admin@test.com" },
    },
  };

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationInboxService, { provide: PrismaService, useValue: { client: prisma } }],
    }).compile();

    service = module.get(NotificationInboxService);
  });

  describe("findMine", () => {
    it("returns paginated notifications for the user", async () => {
      prisma.notificationRecipient.findMany.mockResolvedValue([mockRecipient] as never);
      prisma.notificationRecipient.count.mockResolvedValue(1);
      const query = { limit: 10, offset: 0, deleted: false, unreadOnly: false };

      const _result = await service.findMine(10, query);
      expect(prisma.notificationRecipient.findMany).toHaveBeenCalledWith({
        where: { userId: 10 },
        include: {
          notification: {
            include: {
              sender: { select: { id: true, fullName: true, fullNameAr: true, email: true } },
            },
          },
        },
        skip: 0,
        take: 10,
        orderBy: { notification: { sentAt: "desc" } },
      });
    });

    it("filters by unreadOnly when set", async () => {
      prisma.notificationRecipient.findMany.mockResolvedValue([] as never);
      prisma.notificationRecipient.count.mockResolvedValue(0);
      const query = { limit: 10, offset: 0, unreadOnly: true, deleted: false };

      await service.findMine(10, query);

      expect(prisma.notificationRecipient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 10, isRead: false },
        }),
      );
    });

    it("returns empty array when no notifications", async () => {
      prisma.notificationRecipient.findMany.mockResolvedValue([] as never);
      prisma.notificationRecipient.count.mockResolvedValue(0);

      const result = await service.findMine(99, { limit: 10, offset: 0, deleted: false, unreadOnly: false });

      expect(result.data).toStrictEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("markRead", () => {
    it("updates isRead and readAt after verifying ownership", async () => {
      const updated = { ...mockRecipient, isRead: true, readAt: new Date() };
      prisma.notificationRecipient.findFirstOrThrow.mockResolvedValue(mockRecipient as never);
      prisma.notificationRecipient.update.mockResolvedValue(updated as never);

      const result = await service.markRead(1, 10);

      expect(result).toStrictEqual(updated);
      expect(prisma.notificationRecipient.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: 1, userId: 10 },
      });
      expect(prisma.notificationRecipient.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isRead: true, readAt: expect.any(Date) as Date },
        include: { notification: true },
      });
    });

    it("propagates rejection when not found", async () => {
      prisma.notificationRecipient.findFirstOrThrow.mockRejectedValue(new Error("Not found"));

      await expect(service.markRead(999, 10)).rejects.toThrow("Not found");
      expect(prisma.notificationRecipient.update).not.toHaveBeenCalled();
    });
  });

  describe("markUnRead", () => {
    it("updates isRead to false and readAt to null after verifying ownership", async () => {
      const readRecipient = { ...mockRecipient, isRead: true, readAt: new Date() };
      const updated = { ...mockRecipient, isRead: false, readAt: null };
      prisma.notificationRecipient.findFirstOrThrow.mockResolvedValue(readRecipient as never);
      prisma.notificationRecipient.update.mockResolvedValue(updated as never);

      const result = await service.markUnRead(1, 10);

      expect(result).toStrictEqual(updated);
      expect(prisma.notificationRecipient.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isRead: false, readAt: null },
        include: { notification: true },
      });
    });

    it("propagates rejection when not found", async () => {
      prisma.notificationRecipient.findFirstOrThrow.mockRejectedValue(new Error("Not found"));

      await expect(service.markUnRead(999, 10)).rejects.toThrow("Not found");
    });
  });
});

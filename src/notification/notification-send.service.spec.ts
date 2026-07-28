/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { mockDeep, DeepMockProxy, mock } from "jest-mock-extended";
import { NotificationTargetType, UserRole } from "@/prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { NotificationSendService } from "./notification-send.service";
import { NotificationsService } from "./notification.service";
import { SendNotificationDto } from "./dto/send-notification.dto";

describe("NotificationSendService", () => {
  let service: NotificationSendService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let i18n: jest.Mocked<I18nService<I18nTranslations>>;

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();
    notificationsService = mock<NotificationsService>();
    i18n = mock<I18nService<I18nTranslations>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSendService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(NotificationSendService);
  });

  describe("send", () => {
    const baseDto: SendNotificationDto = {
      title: "Announcement",
      titleAr: undefined,
      body: "Important notice",
      bodyAr: undefined,
      targetType: NotificationTargetType.ALL,
    };

    const mockNotificationRecord = {
      id: 1,
      senderId: 1,
      title: "Announcement",
      titleAr: null,
      body: "Important notice",
      bodyAr: null,
      targetType: NotificationTargetType.ALL,
      targetRole: null,
      sentAt: new Date(),
      sender: { id: 1, fullName: "Admin", fullNameAr: null },
      recipients: [
        { id: 10, userId: 5, user: { email: "user5@test.com" } },
        { id: 11, userId: 6, user: { email: "user6@test.com" } },
      ],
    };

    it("sends to ALL active users", async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }] as never);
      prisma.notification.create.mockResolvedValue(mockNotificationRecord as never);

      const result = await service.send(1, baseDto);

      expect(result.id).toBe(1);
      expect(result.recipientCount).toBe(2);
      expect(notificationsService.addNotifications).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 5 }),
          expect.objectContaining({ userId: 6 }) as object,
        ]),
        "send-notification",
      );
    });

    it("sends to ROLE target", async () => {
      const dto: SendNotificationDto = {
        ...baseDto,
        targetType: NotificationTargetType.ROLE,
        targetRole: UserRole.CASHIER,
      };
      prisma.user.findMany.mockResolvedValue([{ id: 5 }] as never);
      prisma.notification.create.mockResolvedValue(mockNotificationRecord as never);

      await service.send(1, dto);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: UserRole.CASHIER }) as object,
        }),
      );
    });

    it("sends to USER target by IDs", async () => {
      const dto: SendNotificationDto = { ...baseDto, targetType: NotificationTargetType.USER, userIds: [5, 6] };
      prisma.user.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }] as never);
      prisma.notification.create.mockResolvedValue(mockNotificationRecord as never);

      await service.send(1, dto);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: [5, 6] } }) as object,
        }),
      );
    });

    it("throws BadRequest when no recipients match", async () => {
      prisma.user.findMany.mockResolvedValue([] as never);
      i18n.t.mockReturnValue("No recipients found");

      await expect(service.send(1, baseDto)).rejects.toThrow(BadRequestException);
      expect(notificationsService.addNotifications).not.toHaveBeenCalled();
    });
  });

  describe("getHistory", () => {
    const mockData = [
      {
        id: 1,
        title: "Notice",
        body: "Body",
        targetType: NotificationTargetType.ALL,
        targetRole: null,
        sentAt: new Date(),
        sender: { id: 1, fullName: "Admin", fullNameAr: null, email: "admin@test.com" },
        _count: { recipients: 5 },
      },
    ];

    it("returns paginated notification history", async () => {
      prisma.notification.findMany.mockResolvedValue(mockData as never);
      prisma.notification.count.mockResolvedValue(1);

      const result = await service.getHistory({ limit: 10, offset: 0, deleted: false });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.recipientCount).toBe(5);
      expect(result.total).toBe(1);
    });

    it("returns empty array when no history", async () => {
      prisma.notification.findMany.mockResolvedValue([] as never);
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.getHistory({ limit: 10, offset: 0, deleted: false });

      expect(result.data).toStrictEqual([]);
      expect(result.total).toBe(0);
    });
  });
});

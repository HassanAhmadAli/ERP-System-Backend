/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { mock, mockDeep, DeepMockProxy } from "jest-mock-extended";
import { getQueueToken } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Namespace, Socket } from "socket.io";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { PrismaService, createPrismaClient } from "@/prisma/prisma.service";
import { HashingService } from "@/hashing/hashing.service";
import { AppCachingService } from "@/caching/caching.service";
import { Keys } from "@/common/const";
import { NotificationsService } from "./notification.service";
import { NotificationConsumer } from "./notification.consumer";
import { Notification } from "./notification.interface";

describe("NotificationsService", () => {
  let service: NotificationsService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;
  let hashingService: jest.Mocked<HashingService>;
  let cachingService: DeepMockProxy<AppCachingService>;
  let notificationConsumer: jest.Mocked<NotificationConsumer>;
  let queueMock: jest.Mocked<Queue<Notification>>;
  let i18n: jest.Mocked<I18nService<I18nTranslations>>;

  const validToken = "valid.jwt.token";
  const validDecodedPayload = {
    sub: 1,
    email: "test@example.com",
    role: "CASHIER",
    language: "en",
    tokenType: "access",
  } as const;

  const makeSocket = (token?: string) => {
    const client = mock<Socket>();
    const query: Record<string, string | string[]> = {};
    if (token != null) query.token = token;
    client.handshake.query = query;
    return client;
  };

  const makeNamespace = () => mock<Namespace>();

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();
    hashingService = mock<HashingService>();
    cachingService = mockDeep<AppCachingService>();
    notificationConsumer = mock<NotificationConsumer>();
    queueMock = mock<Queue<Notification>>();
    i18n = mock<I18nService<I18nTranslations>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: HashingService, useValue: hashingService },
        { provide: AppCachingService, useValue: cachingService },
        { provide: NotificationConsumer, useValue: notificationConsumer },
        { provide: getQueueToken(Keys.notification), useValue: queueMock },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe("handleConnection", () => {
    it("accepts a socket with a valid token and registers it", async () => {
      const client = makeSocket(validToken);
      hashingService.verifyJwtToken.mockResolvedValue(validDecodedPayload);
      cachingService.socketIo.checkSocketid.mockResolvedValue(undefined);
      cachingService.socketIo.registerSocket.mockResolvedValue(undefined);

      await service.handleConnection(client);

      expect(hashingService.verifyJwtToken).toHaveBeenCalledWith(validToken);
      expect(cachingService.socketIo.checkSocketid).toHaveBeenCalledWith(client.id);
      expect(cachingService.socketIo.registerSocket).toHaveBeenCalledWith(client.id, validDecodedPayload.sub);
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it("disconnects a socket with no token", async () => {
      const client = makeSocket();

      await service.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(hashingService.verifyJwtToken).not.toHaveBeenCalled();
    });

    it("disconnects when verifyJwtToken throws", async () => {
      const client = makeSocket(validToken);
      hashingService.verifyJwtToken.mockRejectedValue(new Error("jwt expired"));

      await service.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });

    it("disconnects when the decoded payload fails ActiveUserSchema validation", async () => {
      const client = makeSocket(validToken);
      hashingService.verifyJwtToken.mockResolvedValue({
        sub: "not-a-number",
      });

      await service.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(cachingService.socketIo.registerSocket).not.toHaveBeenCalled();
    });

    it("disconnects when checkSocketid throws", async () => {
      const client = makeSocket(validToken);
      hashingService.verifyJwtToken.mockResolvedValue(validDecodedPayload);
      cachingService.socketIo.checkSocketid.mockRejectedValue(new Error("already registered"));

      await service.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(cachingService.socketIo.registerSocket).not.toHaveBeenCalled();
    });
  });

  describe("handleDisconnect", () => {
    it("disconnects the client and removes the socket mapping", async () => {
      const client = makeSocket();

      await service.handleDisconnect(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(cachingService.socketIo.unRegisterSocket).toHaveBeenCalledWith(client.id);
    });
  });

  describe("addNotification", () => {
    it("adds a job to the notification queue", async () => {
      const notification: Notification = {
        title: "Test",
        userId: 1,
        email: null,
        message: "Test message",
        type: "info",
        createdAt: new Date(),
      };
      const name = "send-notification";

      await service.addNotification(notification, name);

      expect(queueMock.add).toHaveBeenCalledWith(name, notification);
    });
  });

  describe("addNotifications", () => {
    it("adds bulk jobs to the notification queue", async () => {
      const notifications: Notification[] = [
        {
          title: "A",
          userId: 1,
          email: null,
          message: "Msg A",
          type: "info",
          createdAt: new Date(),
        },
        {
          title: "B",
          userId: 2,
          email: "b@test.com",
          message: "Msg B",
          type: "warning",
          createdAt: new Date(),
        },
      ];
      const name = "bulk-notification";

      await service.addNotifications(notifications, name);

      expect(queueMock.addBulk).toHaveBeenCalledWith([
        { name, data: notifications[0] },
        { name, data: notifications[1] },
      ]);
    });
  });

  describe("setNamespace", () => {
    it("sets the namespace and propagates to the consumer", () => {
      const namespace = makeNamespace();

      service.setNamespace(namespace);

      expect(service.namespace).toBe(namespace);
      expect(notificationConsumer.setNamespace).toHaveBeenCalledWith(namespace);
    });
  });
});

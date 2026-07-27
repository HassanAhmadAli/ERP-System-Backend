import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { Cache } from "@nestjs/cache-manager";
import { I18nService } from "nestjs-i18n";
import { AppCachingService } from "./caching.service";
import { PrismaService } from "@/prisma/prisma.service";
import { CashingNamespace } from "@/common/const";
import type { cachedUserPayload } from "./interface/cached-user-payload.interface";
import { UserRole } from "@/prisma/client";

describe("AppCachingService", () => {
  let service: AppCachingService;
  let cacheGetMock: jest.Mock;
  let cacheSetMock: jest.Mock;
  let cacheDelMock: jest.Mock;
  let findUniqueOrThrowMock: jest.Mock;
  let i18nTMock: jest.Mock;

  const mockCachedUser: cachedUserPayload = {
    id: 1,
    email: "user@example.com",
    fullName: "Test User",
    role: UserRole.CUSTOMER,
  };

  beforeEach(async () => {
    cacheGetMock = jest.fn();
    cacheSetMock = jest.fn();
    cacheDelMock = jest.fn();
    findUniqueOrThrowMock = jest.fn();
    i18nTMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppCachingService,
        {
          provide: Cache,
          useValue: {
            get: cacheGetMock,
            set: cacheSetMock,
            del: cacheDelMock,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: {
                findUniqueOrThrow: findUniqueOrThrowMock,
              },
            },
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: i18nTMock,
          },
        },
      ],
    }).compile();

    service = module.get(AppCachingService);
  });

  describe("socketIo.checkSocketid", () => {
    it("resolves when socketId is not in cache", async () => {
      cacheGetMock.mockResolvedValue(undefined);

      await expect(service.socketIo.checkSocketid("socket-123")).resolves.toBeUndefined();

      expect(cacheGetMock).toHaveBeenCalledWith(`${CashingNamespace.SocketIo.UserId_By_SocketId}:socket-123`);
    });

    it("throws BadRequestException when socketId is already registered", async () => {
      cacheGetMock.mockResolvedValue(42);
      i18nTMock.mockReturnValue("Socket already registered");

      await expect(service.socketIo.checkSocketid("socket-123")).rejects.toThrow(BadRequestException);

      expect(i18nTMock).toHaveBeenCalledWith("errors.caching.socketAlreadyRegistered");
    });
  });

  describe("socketIo.registerSocket", () => {
    it("sets both cache mappings for socketId and userId", async () => {
      await expect(service.socketIo.registerSocket("socket-456", 99)).resolves.toBeUndefined();

      expect(cacheSetMock).toHaveBeenCalledWith(`${CashingNamespace.SocketIo.UserId_By_SocketId}:socket-456`, 99);
      expect(cacheSetMock).toHaveBeenCalledWith(`${CashingNamespace.SocketIo.SocketId_By_UserId}:99`, "socket-456");
    });
  });

  describe("socketIo.unRegisterSocket", () => {
    it("deletes socket mapping and then cleans up user mapping when userId exists", async () => {
      cacheDelMock.mockResolvedValue(undefined);
      cacheGetMock.mockResolvedValue(99);

      await expect(service.socketIo.unRegisterSocket("socket-789")).resolves.toBeUndefined();

      expect(cacheDelMock).toHaveBeenCalledWith(`${CashingNamespace.SocketIo.UserId_By_SocketId}:socket-789`);
      expect(cacheGetMock).toHaveBeenCalledWith(`${CashingNamespace.SocketIo.UserId_By_SocketId}:socket-789`);
      expect(cacheDelMock).toHaveBeenCalledWith(`${CashingNamespace.SocketIo.SocketId_By_UserId}:99`);
    });

    it("returns early when userId is undefined after initial delete", async () => {
      cacheDelMock.mockResolvedValue(undefined);
      cacheGetMock.mockResolvedValue(undefined);

      await expect(service.socketIo.unRegisterSocket("socket-789")).resolves.toBeUndefined();

      expect(cacheDelMock).toHaveBeenCalledTimes(1);
      expect(cacheDelMock).toHaveBeenCalledWith(`${CashingNamespace.SocketIo.UserId_By_SocketId}:socket-789`);
    });
  });

  describe("socketIo.getSocketid", () => {
    it("returns the socketId when found in cache", async () => {
      cacheGetMock.mockResolvedValue("socket-found");

      const result = await service.socketIo.getSocketid(42);

      expect(result).toBe("socket-found");
      expect(cacheGetMock).toHaveBeenCalledWith(`${CashingNamespace.SocketIo.SocketId_By_UserId}:42`);
    });

    it("throws BadRequestException when no socketId is cached for the user", async () => {
      cacheGetMock.mockResolvedValue(undefined);
      i18nTMock.mockReturnValue("Socket not registered");

      await expect(service.socketIo.getSocketid(42)).rejects.toThrow(BadRequestException);

      expect(i18nTMock).toHaveBeenCalledWith("errors.caching.socketNotRegistered");
    });
  });

  describe("users.removeCachedUserData", () => {
    it("deletes the cached user data key", async () => {
      await expect(service.users.removeCachedUserData(7)).resolves.toBeUndefined();

      expect(cacheDelMock).toHaveBeenCalledWith(`${CashingNamespace.User.UserData_By_UserId}:7`);
    });
  });

  describe("users.getCachedUserData", () => {
    it("returns cached user data on cache hit", async () => {
      cacheGetMock.mockResolvedValue(mockCachedUser);

      const result = await service.users.getCachedUserData(1);

      expect(result).toStrictEqual(mockCachedUser);
      expect(cacheGetMock).toHaveBeenCalledWith(`${CashingNamespace.User.UserData_By_UserId}:1`);
      expect(findUniqueOrThrowMock).not.toHaveBeenCalled();
    });

    it("fetches from database and caches it on cache miss", async () => {
      cacheGetMock.mockResolvedValue(undefined);
      findUniqueOrThrowMock.mockResolvedValue(mockCachedUser);

      const result = await service.users.getCachedUserData(1);

      expect(result).toStrictEqual(mockCachedUser);
      expect(cacheGetMock).toHaveBeenCalledWith(`${CashingNamespace.User.UserData_By_UserId}:1`);
      expect(findUniqueOrThrowMock).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, email: true, fullName: true, role: true },
      });
      expect(cacheSetMock).toHaveBeenCalledWith(
        `${CashingNamespace.User.UserData_By_UserId}:1`,
        mockCachedUser,
        60 * 1000,
      );
    });

    it("propagates error when database query fails", async () => {
      cacheGetMock.mockResolvedValue(undefined);
      const dbError = new Error("Database connection failed");
      findUniqueOrThrowMock.mockRejectedValue(dbError);

      await expect(service.users.getCachedUserData(1)).rejects.toThrow(dbError);
    });
  });
});

import { PrismaService } from "@/prisma/prisma.service";
import { logger } from "@/utils";
import { Cache } from "@nestjs/cache-manager";
import { BadRequestException, Injectable } from "@nestjs/common";
import { cachedUserPayload } from "./interface/cached-user-payload.interface";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

import { CacheKey, CashingNamespace } from "../common/const";
@Injectable()
export class AppCachingService {
  constructor(
    public readonly manager: Cache,
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}
  public get prisma() {
    return this.prismaService.client;
  }
  public readonly socketIo = {
    checkSocketid: async (socketId: string) => {
      const exist = await this.manager.get<string>(
        `${CashingNamespace.SocketIo.UserId_By_SocketId}:${socketId}` satisfies CacheKey,
      );
      if (exist) {
        logger.trace(`this socket is already registered ${socketId}`);
        throw new BadRequestException(this.i18n.t("errors.caching.socketAlreadyRegistered"));
      }
    },
    registerSocket: async (socketId: string, userId: number) => {
      await this.manager.set<number>(
        `${CashingNamespace.SocketIo.UserId_By_SocketId}:${socketId}` satisfies CacheKey,
        userId,
      );
      await this.manager.set<string>(
        `${CashingNamespace.SocketIo.SocketId_By_UserId}:${userId}` satisfies CacheKey,
        socketId,
      );
    },
    unRegisterSocket: async (socketId: string) => {
      await this.manager.del(`${CashingNamespace.SocketIo.UserId_By_SocketId}:${socketId}` satisfies CacheKey);
      const userId = await this.manager.get<number>(
        `${CashingNamespace.SocketIo.UserId_By_SocketId}:${socketId}` satisfies CacheKey,
      );
      if (userId == undefined) return;
      await this.manager.del(`${CashingNamespace.SocketIo.SocketId_By_UserId}:${userId}` satisfies CacheKey);
    },
    getSocketid: async (userId: number) => {
      const exist = await this.manager.get<string>(
        `${CashingNamespace.SocketIo.SocketId_By_UserId}:${userId}` satisfies CacheKey,
      );
      if (exist) return exist;
      throw new BadRequestException(this.i18n.t("errors.caching.socketNotRegistered"));
    },
  } as const;

  public readonly users = {
    removeCachedUserData: async (userId: number) => {
      await this.manager.del(`${CashingNamespace.User.UserData_By_UserId}:${userId}` satisfies CacheKey);
    },
    getCachedUserData: async (userId: number): Promise<cachedUserPayload> => {
      const key = `${CashingNamespace.User.UserData_By_UserId}:${userId}` satisfies CacheKey;
      const cachedUserData = await this.manager.get<cachedUserPayload>(key);
      if (cachedUserData != undefined) {
        return cachedUserData;
      }
      const user = await this.prisma.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      });
      await this.manager.set<typeof user>(key, user, 60 * 1000);
      return user;
    },
  } as const;
}

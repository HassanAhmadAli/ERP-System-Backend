import { Test, TestingModule } from "@nestjs/testing";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { UnauthorizedException } from "@nestjs/common";
import { LocalStrategy } from "./local.strategy";
import { PrismaService } from "@/prisma/prisma.service";
import { HashingService } from "@/hashing/hashing.service";
import { NotificationsService } from "@/notification/notification.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

describe("LocalStrategy", () => {
  let strategy: LocalStrategy;
  let prismaService: jest.Mocked<PrismaService>;
  let hashingService: jest.Mocked<HashingService>;
  let cacheManager: jest.Mocked<Cache>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  const email = "test@example.com";
  const password = "TestPass123";
  const userId = 1;

  const mockUser = {
    id: userId,
    role: "CASHIER",
    isVerified: true,
    language: "en",
    passwordHash: "hashed-password",
  } as const;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: {
                findFirst: jest.fn(),
              },
            },
          },
        },
        {
          provide: HashingService,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => {
              if (key === "errors.auth.invalidCredentials") return "Invalid credentials";
              if (key === "notifications.auth.securityAlertSubject") return "Security Alert";
              if (key === "notifications.auth.securityAlertBody") return "Alert body";
              return key;
            }),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            addNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    prismaService = module.get(PrismaService);
    hashingService = module.get(HashingService);
    cacheManager = module.get(CACHE_MANAGER);
    notificationsService = module.get(NotificationsService);
    i18nService = module.get(I18nService);
  });

  describe("validate", () => {
    it("validate_userNotFound_throwsUnauthorized", async () => {
      prismaService.client.user.findFirst.mockResolvedValue(null);
      cacheManager.get.mockResolvedValue(undefined);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.invalidCredentials");
      expect(cacheManager.set).toHaveBeenCalledWith(`password-mismatch-${email}`, 1);
    });

    it("validate_unverifiedUser_throwsUnauthorized", async () => {
      const unverifiedUser = { ...mockUser, isVerified: false };
      prismaService.client.user.findFirst.mockResolvedValue(unverifiedUser);
      cacheManager.get.mockResolvedValue(undefined);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);
      expect(cacheManager.set).toHaveBeenCalledWith(`password-mismatch-${email}`, 1);
    });

    it("validate_wrongPassword_throwsUnauthorized", async () => {
      prismaService.client.user.findFirst.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(false);
      cacheManager.get.mockResolvedValue(undefined);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);
      expect(cacheManager.set).toHaveBeenCalledWith(`password-mismatch-${email}`, 1);
    });

    it("validate_validCredentials_returnsActiveUser", async () => {
      prismaService.client.user.findFirst.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(true);

      const result = await strategy.validate(email, password);

      expect(result).toStrictEqual({
        sub: userId,
        email,
        role: "CASHIER",
        language: "en",
        tokenType: "access",
      });
      expect(hashingService.compare).toHaveBeenCalledWith({
        raw: password,
        encrypted: mockUser.passwordHash,
      });
    });
  });

  describe("handlePasswordNotMatch (via validate with wrong password)", () => {
    it("handlePasswordNotMatch_firstAttempt_setsCacheToOne", async () => {
      prismaService.client.user.findFirst.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(false);
      cacheManager.get.mockResolvedValue(undefined);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);

      expect(cacheManager.get).toHaveBeenCalledWith(`password-mismatch-${email}`);
      expect(cacheManager.set).toHaveBeenCalledWith(`password-mismatch-${email}`, 1);
    });

    it("handlePasswordNotMatch_underThreeAttempts_incrementsCache", async () => {
      prismaService.client.user.findFirst.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(false);
      cacheManager.get.mockResolvedValue(1);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);

      expect(cacheManager.set).toHaveBeenCalledWith(`password-mismatch-${email}`, 2);
    });

    it("handlePasswordNotMatch_threeAttemptsWithUserId_sendsAlert", async () => {
      prismaService.client.user.findFirst.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(false);
      cacheManager.get.mockResolvedValue(3);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);

      expect(notificationsService.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          userId,
          email,
          type: "security",
        }),
        "send-notification",
      );
    });

    it("handlePasswordNotMatch_threeAttemptsWithoutUserId_returnsSilently", async () => {
      const unverifiedUser = { ...mockUser, isVerified: false };
      prismaService.client.user.findFirst.mockResolvedValue(unverifiedUser);
      cacheManager.get.mockResolvedValue(3);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);

      expect(notificationsService.addNotification).not.toHaveBeenCalled();
    });
  });
});

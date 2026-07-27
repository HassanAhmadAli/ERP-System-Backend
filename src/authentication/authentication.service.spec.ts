import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "@/prisma/client";
import { AuthenticationService } from "./authentication.service";
import { PrismaService } from "@/prisma/prisma.service";
import { HashingService } from "@/hashing/hashing.service";
import { RefreshTokenIdsStorage } from "./refresh-token-ids.storage";
import { NotificationsService } from "@/notification/notification.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

describe("AuthenticationService", () => {
  let service: AuthenticationService;
  let prismaService: jest.Mocked<PrismaService>;
  let hashingService: jest.Mocked<HashingService>;
  let refreshTokenIdsStorage: jest.Mocked<RefreshTokenIdsStorage>;
  let cacheManager: jest.Mocked<Cache>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  const mockActiveUser = {
    sub: 1,
    email: "test@example.com",
    role: "CASHIER",
    language: "en",
    tokenType: "access",
  } as const;

  const mockRefreshPayload = {
    sub: 1,
    refreshTokenId: "refresh-token-id-123",
    tokenType: "refresh",
  } as const;

  const mockUserModel = (
    overrides?: Partial<{
      id: number;
      fullName: string;
      fullNameAr: string | null;
      email: string;
      phoneNumber: string | null;
      passwordHash: string;
      nationalId: string;
      role: UserRole;
      isActive: boolean;
      language: string;
      isVerified: boolean;
      verificationCode: string | null;
      verificationCodeExpiresAt: Date | null;
      deletedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ) => ({
    id: 1,
    fullName: "Test User",
    fullNameAr: null,
    email: "test@example.com",
    phoneNumber: null,
    passwordHash: "hashed-password",
    nationalId: "0000000000",
    role: UserRole.CASHIER,
    isActive: true,
    language: "en",
    isVerified: false,
    verificationCode: null,
    verificationCodeExpiresAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    productPhotos: [],
    employee: null,
    customer: null,
    auditLogs: [],
    sentNotifications: [],
    notificationRecipients: [],
    recordedExpenses: [],
    createdDiscounts: [],
    productImportJobs: [],
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: {
                create: jest.fn(),
                findUniqueOrThrow: jest.fn(),
              },
              $transaction: jest.fn(),
              $queryRaw: jest.fn(),
            },
          },
        },
        {
          provide: HashingService,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
            signAccessToken: jest.fn(),
            signRefreshToken: jest.fn(),
          },
        },
        {
          provide: RefreshTokenIdsStorage,
          useValue: {
            insert: jest.fn(),
            validate: jest.fn(),
            invalidate: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === "NODE_ENV") return "development";
              if (key === "JWT_TTL") return "15m";
              if (key === "JWT_REFRESH_TTL") return "7d";
              return undefined;
            }),
            get: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: Cache,
          useExisting: CACHE_MANAGER,
        },
        {
          provide: NotificationsService,
          useValue: {
            addNotification: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => {
              const translations: Record<string, string> = {
                "errors.auth.invalidCredentials": "Invalid credentials",
                "errors.auth.refreshTokenExpired": "Refresh token expired",
                "errors.auth.userAlreadyVerified": "User already verified",
                "errors.auth.invalidVerificationCode": "Invalid verification code",
                "errors.auth.verificationCodeExpired": "Verification code expired",
                "responses.auth.staffAccountCreated": "Staff account created",
                "responses.auth.userCreated": "User created",
                "responses.auth.accountVerified": "Account verified",
                "notifications.auth.verificationCodeSubject": "Verification code",
                "notifications.auth.verificationCodeBody": "Your code is: {code}",
                "notifications.auth.securityAlertSubject": "Security Alert",
                "notifications.auth.securityAlertBody": "Alert at: {time}",
              };
              return translations[key] ?? key;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    prismaService = module.get(PrismaService);
    hashingService = module.get(HashingService);
    refreshTokenIdsStorage = module.get(RefreshTokenIdsStorage);
    cacheManager = module.get(CACHE_MANAGER);
    notificationsService = module.get(NotificationsService);
    i18nService = module.get(I18nService);
  });

  describe("signIn", () => {
    it("signIn_roleMismatch_throwsUnauthorized", async () => {
      const user = { ...mockActiveUser, role: UserRole.CUSTOMER };

      await expect(service.signIn(user, UserRole.CASHIER)).rejects.toThrow(UnauthorizedException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.invalidCredentials");
    });

    it("signIn_validRole_generatesTokensAndStoresRefreshId", async () => {
      hashingService.signAccessToken.mockResolvedValue("access-token");
      hashingService.signRefreshToken.mockResolvedValue("refresh-token");

      const result = await service.signIn(mockActiveUser, UserRole.CASHIER);

      expect(result).toStrictEqual({
        access_token: "access-token",
        refresh_token: "refresh-token",
      });
      expect(refreshTokenIdsStorage.insert).toHaveBeenCalledWith(mockActiveUser.sub, expect.any(String));
    });

    it("signIn_noExpectedRole_allowsAnyRole", async () => {
      const user = { ...mockActiveUser, role: UserRole.CUSTOMER };
      hashingService.signAccessToken.mockResolvedValue("access-token");
      hashingService.signRefreshToken.mockResolvedValue("refresh-token");

      const result = await service.signIn(user, undefined);

      expect(result).toBeDefined();
      expect(refreshTokenIdsStorage.insert).toHaveBeenCalled();
    });
  });

  describe("signout", () => {
    it("signout_callsInvalidateOnStorage", async () => {
      await service.signout({ sub: 1, refreshTokenId: "rt-id", tokenType: "refresh" });

      expect(refreshTokenIdsStorage.invalidate).toHaveBeenCalledWith(1);
    });
  });

  describe("refreshTokens", () => {
    it("refreshTokens_invalidTokenId_throwsUnauthorized", async () => {
      refreshTokenIdsStorage.validate.mockResolvedValue(false);

      await expect(
        service.refreshTokens({ sub: 1, refreshTokenId: "invalid-id", tokenType: "refresh" }),
      ).rejects.toThrow(UnauthorizedException);

      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.refreshTokenExpired");
    });

    it("refreshTokens_validToken_generatesNewTokensAndInvalidatesOld", async () => {
      refreshTokenIdsStorage.validate.mockResolvedValue(true);
      refreshTokenIdsStorage.invalidate.mockResolvedValue(undefined);
      jest
        .mocked(prismaService.client.user.findUniqueOrThrow)
        .mockResolvedValue(mockUserModel({ role: UserRole.CASHIER }));
      hashingService.signAccessToken.mockResolvedValue("new-access-token");
      hashingService.signRefreshToken.mockResolvedValue("new-refresh-token");

      const result = await service.refreshTokens(mockRefreshPayload);

      expect(refreshTokenIdsStorage.invalidate).toHaveBeenCalledWith(1);
      expect(prismaService.client.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { role: true, email: true, language: true },
      });
      expect(result).toStrictEqual({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      });
      expect(refreshTokenIdsStorage.insert).toHaveBeenCalledWith(1, expect.any(String));
    });
  });

  describe("verifyEmail", () => {
    const email = "test@example.com";
    const code = "12345678";

    it("verifyEmail_userNotFound_throwsBadRequest", async () => {
      jest.mocked(prismaService.client.$transaction).mockImplementation(async (cb: any) => {
        return cb(prismaService.client);
      });
      jest.mocked(prismaService.client.$queryRaw).mockResolvedValue([]);

      await expect(service.verifyEmail({ email, code })).rejects.toThrow(BadRequestException);
    });

    it("verifyEmail_alreadyVerified_throwsBadRequest", async () => {
      const user = {
        email,
        isVerified: true,
        verificationCode: code,
        verificationCodeExpiresAt: new Date(Date.now() + 3600000),
      };
      jest.mocked(prismaService.client.$transaction).mockImplementation(async (cb: any) => {
        return cb(prismaService.client);
      });
      jest.mocked(prismaService.client.$queryRaw).mockResolvedValue([user]);

      await expect(service.verifyEmail({ email, code })).rejects.toThrow(BadRequestException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.userAlreadyVerified");
    });

    it("verifyEmail_wrongCode_throwsUnauthorized", async () => {
      const user = {
        email,
        isVerified: false,
        verificationCode: "different-code",
        verificationCodeExpiresAt: new Date(Date.now() + 3600000),
      };
      jest.mocked(prismaService.client.$transaction).mockImplementation(async (cb: any) => {
        return cb(prismaService.client);
      });
      jest.mocked(prismaService.client.$queryRaw).mockResolvedValue([user]);

      await expect(service.verifyEmail({ email, code })).rejects.toThrow(UnauthorizedException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.invalidVerificationCode");
    });

    it("verifyEmail_expiredCode_throwsUnauthorized", async () => {
      const user = {
        email,
        isVerified: false,
        verificationCode: code,
        verificationCodeExpiresAt: new Date(Date.now() - 3600000),
      };
      jest.mocked(prismaService.client.$transaction).mockImplementation(async (cb: any) => {
        return cb(prismaService.client);
      });
      jest.mocked(prismaService.client.$queryRaw).mockResolvedValue([user]);

      await expect(service.verifyEmail({ email, code })).rejects.toThrow(UnauthorizedException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.verificationCodeExpired");
    });

    it("verifyEmail_validCode_updatesUserAndReturnsSuccess", async () => {
      const user = {
        id: 1,
        email,
        isVerified: false,
        verificationCode: code,
        verificationCodeExpiresAt: new Date(Date.now() + 3600000),
      };
      jest.mocked(prismaService.client.$transaction).mockImplementation(async (cb: any) => {
        return cb(prismaService.client);
      });
      jest.mocked(prismaService.client.$queryRaw).mockResolvedValue([user]);
      prismaService.client.user.update = jest.fn().mockResolvedValue({});

      const result = await service.verifyEmail({ email, code });

      expect(result).toStrictEqual({ message: "Account verified" });
      expect(prismaService.client.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });
    });
  });

  describe("genericSignup", () => {
    const signupDto = {
      fullName: "Test User",
      email: "test@example.com",
      password: "TestPass123",
      nationalId: "1234567890",
    };

    it("genericSignup_developmentEnv_returnsVerificationCodeInMessage", async () => {
      hashingService.hash.mockResolvedValue("hashed-password");
      jest.mocked(prismaService.client.user.create).mockResolvedValue(mockUserModel({ id: 1, email: signupDto.email }));

      const result = await service.genericSignup(UserRole.CUSTOMER, signupDto);

      expect(result.message).toContain("12345678");
      expect(prismaService.client.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "CUSTOMER",
            verificationCode: "12345678",
            isVerified: false,
          }),
        }),
      );
      expect(notificationsService.addNotification).not.toHaveBeenCalled();
    });

    it("genericSignup_productionEnv_sendsNotification", async () => {
      Object.defineProperty(service, "NODE_ENV", { value: "production", configurable: true, writable: true });

      hashingService.hash.mockResolvedValue("hashed-password");
      jest.mocked(prismaService.client.user.create).mockResolvedValue(mockUserModel({ id: 1, email: signupDto.email }));

      const result = await service.genericSignup(UserRole.CUSTOMER, signupDto);

      expect(result.message).toBe("User created");
      expect(notificationsService.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          userId: 1,
          email: signupDto.email,
          type: "security",
        }),
        "send-notification",
      );
    });
  });

  describe("createVerifiedStaff", () => {
    it("createVerifiedStaff_createsStaffUserWithEmployeeRecord", async () => {
      const staffDto = {
        fullName: "Staff User",
        email: "staff@example.com",
        password: "TestPass123",
        nationalId: "0987654321",
        role: "CASHIER" as const,
        jobTitle: "Cashier",
      };

      hashingService.hash.mockResolvedValue("hashed-password");
      jest
        .mocked(prismaService.client.user.create)
        .mockResolvedValue(
          mockUserModel({
            id: 1,
            email: staffDto.email,
            fullName: staffDto.fullName,
            fullNameAr: null,
            role: staffDto.role,
          }),
        );

      const result = await service.createVerifiedStaff(staffDto);

      expect(result.message).toBe("Staff account created");
      expect(result.user).toBeDefined();
      expect(prismaService.client.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "CASHIER",
            isVerified: true,
            passwordHash: "hashed-password",
            employee: expect.objectContaining({
              create: { jobTitle: "Cashier" },
            }),
          }),
          select: expect.objectContaining({
            id: true,
            email: true,
            fullName: true,
            role: true,
          }),
        }),
      );
    });
  });

  describe("generateTokens", () => {
    it("generateTokens_returnsAccessAndRefreshTokens", async () => {
      hashingService.signAccessToken.mockResolvedValue("access-token-value");
      hashingService.signRefreshToken.mockResolvedValue("refresh-token-value");

      const result = await service.generateTokens(mockActiveUser);

      expect(result).toHaveProperty("access_token", "access-token-value");
      expect(result).toHaveProperty("refresh_token", "refresh-token-value");
      expect(result).toHaveProperty("refreshTokenId");
      expect(result.refreshTokenId).toContain("userId=1");
    });
  });

  describe("handlePasswordNotMatch", () => {
    const email = "test@example.com";
    const userId = 1;

    it("handlePasswordNotMatch_firstAttempt_setsCacheToOne", async () => {
      cacheManager.get.mockResolvedValue(undefined);

      await service.handlePasswordNotMatch({ email, userId });

      expect(cacheManager.set).toHaveBeenCalledWith(`password-mismatch-${email}`, 1);
    });

    it("handlePasswordNotMatch_underThreeAttempts_incrementsCache", async () => {
      cacheManager.get.mockResolvedValue(1);

      await service.handlePasswordNotMatch({ email, userId });

      expect(cacheManager.set).toHaveBeenCalledWith(`password-mismatch-${email}`, 2);
    });

    it("handlePasswordNotMatch_threeAttemptsWithUserId_sendsAlert", async () => {
      cacheManager.get.mockResolvedValue(3);

      await service.handlePasswordNotMatch({ email, userId });

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
  });
});

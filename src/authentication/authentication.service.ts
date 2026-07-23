import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { HashingService } from "@/hashing/hashing.service";
import { SignupDto } from "./dto/signinup.dto";
import { SigninDto } from "./dto/signin.dto";
import { DurationType } from "@/common/schema/duration-schema";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ActiveUserSchema, RefreshTokenPayloadSchema, ActiveUserInput } from "./dto/request-user.dto";
import { randomUUID, randomInt } from "node:crypto";
import { RefreshTokenIdsStorage } from "./refresh-token-ids.storage";
import { Prisma, User, UserRole } from "@/prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { SignoutDto } from "./dto/signout.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { logger } from "@/utils";
import { Cache } from "@nestjs/cache-manager";
import { NotificationsService } from "@/notification/notification.service";
import { CreateStaffDto } from "@/user/dto/create-staff.dto";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

@Injectable()
export class AuthenticationService {
  constructor(
    private prismaService: PrismaService,
    private readonly hashingService: HashingService,
    @Inject(RefreshTokenIdsStorage)
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly config: ConfigService<EnvVariables>,
    private cacheManager: Cache,
    private readonly notificationsService: NotificationsService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    this.NODE_ENV = this.config.getOrThrow("NODE_ENV", {
      infer: true,
    });
    this.JWT_TTL = this.config.getOrThrow("JWT_TTL", { infer: true });
    this.JWT_REFRESH_TTL = this.config.getOrThrow("JWT_REFRESH_TTL", { infer: true });
  }
  private NODE_ENV: EnvVariables["NODE_ENV"];
  private JWT_TTL: DurationType;
  private JWT_REFRESH_TTL: DurationType;
  public get prisma() {
    return this.prismaService.client;
  }
  async createVerifiedStaff({ role, password: rawPassword, jobTitle, ...signupDto }: CreateStaffDto) {
    const passwordHash = await this.hashingService.hash(rawPassword);

    const user = await this.prisma.user.create({
      data: {
        role,
        ...signupDto,
        passwordHash,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        employee: {
          create: {
            jobTitle,
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    return {
      message: this.i18n.t("responses.auth.staffAccountCreated"),
      user,
    };
  }

  async genericSignup(role: UserRole, { password: rawPassword, ...signupDto }: SignupDto) {
    const passwordHash = await this.hashingService.hash(rawPassword);
    const verificationCode = (this.NODE_ENV === "production" ? randomInt(10000000, 99999999) : 12345678).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const user = await this.prisma.user.create({
      data: {
        role,
        ...signupDto,
        passwordHash,
        isVerified: false,
        verificationCode,
        verificationCodeExpiresAt,
      },
      select: {
        id: true,
        email: true,
      },
    });
    if (this.NODE_ENV === "development") {
      const message = `you are using ${this.NODE_ENV} environment, the otp is ${verificationCode}`;
      logger.debug({ message });
      return { message };
    }

    await this.notificationsService.addNotification(
      {
        title: this.i18n.t("notifications.auth.verificationCodeSubject"),
        userId: user.id,
        email: signupDto.email,
        message: this.i18n.t("notifications.auth.verificationCodeBody", {
          args: { code: verificationCode },
        }),
        type: "security",
        createdAt: new Date(),
      },
      "send-notification",
    );
    return {
      message: this.i18n.t("responses.auth.userCreated"),
    };
  }

  async verifyEmail({ email, code }: VerifyEmailDto) {
    return await this.prisma.$transaction(async (tx) => {
      const queryResult = await tx.$queryRaw<User[] | undefined>(
        Prisma.sql`SELECT * FROM "User" WHERE "email" = ${email} FOR UPDATE`,
      );
      if (queryResult == undefined || queryResult.length === 0) {
        throw new BadRequestException();
      }
      const user = queryResult[0]!;
      if (user.isVerified) {
        throw new BadRequestException(this.i18n.t("errors.auth.userAlreadyVerified"));
      }

      if (user.verificationCode !== code) {
        throw new UnauthorizedException(this.i18n.t("errors.auth.invalidVerificationCode"));
      }

      if (user.verificationCodeExpiresAt != undefined && user.verificationCodeExpiresAt < new Date()) {
        throw new UnauthorizedException(this.i18n.t("errors.auth.verificationCodeExpired"));
      }

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          isVerified: true,
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });

      return {
        message: this.i18n.t("responses.auth.accountVerified"),
      };
    });
  }

  getKey(email: string) {
    return `password-mismatch-${email}`;
  }
  async handlePasswordNotMatch({ email, userId }: { email: string; userId: number }) {
    const key = this.getKey(email);
    const res: number | undefined = await this.cacheManager.get(key);
    if (res == undefined) {
      return await this.cacheManager.set(key, 1);
    }
    if (res < 3) return await this.cacheManager.set(key, res + 1);
    await this.notificationsService.addNotification(
      {
        title: this.i18n.t("notifications.auth.securityAlertSubject"),
        userId,
        email,
        message: this.i18n.t("notifications.auth.securityAlertBody", {
          args: { time: new Date().toISOString() },
        }),
        type: "security",
        createdAt: new Date(),
      },
      "send-notification",
    );
    return;
  }

  async signIn({ email, password: rawPassword }: SigninDto, expectedRole: UserRole | undefined) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
      select: {
        passwordHash: true,
        id: true,
        role: true,
        isVerified: true,
        language: true,
      },
    });

    if (expectedRole != undefined && user.role !== expectedRole) {
      throw new UnauthorizedException(this.i18n.t("errors.auth.invalidCredentials"));
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(this.i18n.t("errors.auth.emailNotVerified"));
    }

    const doesPasswordMatch = await this.hashingService.compare({
      raw: rawPassword,
      encrypted: user.passwordHash,
    });

    if (!doesPasswordMatch) {
      const userId = user.id;
      await this.handlePasswordNotMatch({ email, userId });
      throw new UnauthorizedException(this.i18n.t("errors.auth.passwordIncorrect"));
    }

    const { refreshTokenId, ...generatedTokens } = await this.generateTokens({
      email,
      sub: user.id,
      role: user.role,
      language: user.language as "en" | "ar" | undefined,
    });
    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);
    return generatedTokens;
  }

  async signout({ refresh_token }: SignoutDto) {
    const decoded = await this.hashingService.verifyJwtToken(refresh_token);
    const { sub: userId } = RefreshTokenPayloadSchema.parse(decoded);
    return await this.refreshTokenIdsStorage.invalidate(userId);
  }
  async refreshTokens({ refresh_token }: RefreshTokenDto) {
    const decoded = await this.hashingService.verifyJwtToken(refresh_token);
    const { refreshTokenId, sub: userId } = RefreshTokenPayloadSchema.parse(decoded);
    const isValid = await this.refreshTokenIdsStorage.validate(userId, refreshTokenId);
    if (!isValid) {
      throw new UnauthorizedException(this.i18n.t("errors.auth.refreshTokenExpired"));
    }
    await this.refreshTokenIdsStorage.invalidate(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        role: true,
        email: true,
        language: true,
      },
    });
    const { refreshTokenId: oldRefreshTokenId, ...generateTokens } = await this.generateTokens({
      sub: userId,
      email: user.email,
      role: user.role,
      language: user.language as "en" | "ar" | undefined,
    });
    await this.refreshTokenIdsStorage.insert(userId, oldRefreshTokenId);
    return generateTokens;
  }
  public async generateTokens(payLoadDto: ActiveUserInput) {
    const refreshTokenPayload = RefreshTokenPayloadSchema.parse({
      ...payLoadDto,
      refreshTokenId: `userId=${payLoadDto.sub.toString()}.${randomUUID()}`,
      tokenType: "refresh",
    });
    const accessTokenPayload = ActiveUserSchema.parse({
      ...payLoadDto,
      tokenType: "access",
    });

    const [access_token, refresh_token] = await Promise.all([
      this.hashingService.signAccessToken(accessTokenPayload, this.JWT_TTL),
      this.hashingService.signRefreshToken(refreshTokenPayload, this.JWT_REFRESH_TTL),
    ]);
    return {
      access_token,
      refresh_token,
      refreshTokenId: refreshTokenPayload.refreshTokenId,
    };
  }
}

import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { HashingService } from "@/iam/hashing/hashing.service";
import { SignupDto } from "./dto/signinup.dto";
import { SigninDto } from "./dto/signin.dto";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { DurationType } from "@/common/schema/duration-schema";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import {
  ActiveUserSchema,
  RefreshTokenPayloadSchema,
  RefreshTokenPayload,
  type ActiveUserType,
  ActiveUserInput,
} from "./dto/request-user.dto";
import { randomUUID, randomInt } from "node:crypto";
import { RefreshTokenIdsStorage } from "./refresh-token-ids.storage";
import { Prisma, PrismaService, User } from "@/prisma";
import { ErrorMessages, Keys } from "@/common/const";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { SignoutDto } from "./dto/signout.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { logger } from "@/utils";
import { Cache } from "@nestjs/cache-manager";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Notification } from "@/notifications/notification.interface";
@Injectable()
export class AuthenticationService {
  constructor(
    private prismaService: PrismaService,
    private readonly hashingService: HashingService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(RefreshTokenIdsStorage)
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly config: ConfigService<EnvVariables>,
    private cacheManager: Cache,
    @InjectQueue(Keys.notification) private readonly notificationQueue: Queue<Notification>,
  ) {
    this.NODE_ENV = this.config.getOrThrow("NODE_ENV", {
      infer: true,
    });
  }
  private NODE_ENV: EnvVariables["NODE_ENV"];
  public get prisma() {
    return this.prismaService.client;
  }

  async signup({ password: rawPassword, ...signupDto }: SignupDto) {
    const encryptedPassword = await this.hashingService.hash({
      raw: rawPassword,
    });
    const verificationCode = (this.NODE_ENV === "production" ? randomInt(10000000, 99999999) : 12345678).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    console.log(signupDto);
    const user = await this.prisma.user.create({
      data: {
        ...signupDto,
        password: encryptedPassword,
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
    await this.notificationQueue.add("send-notification", {
      title: "Verification Code for the Complaint App",
      //todo:
      userId: user.id,
      email: signupDto.email,
      message: `Your verification code is: ${verificationCode} , it will expire in 15 minutes`,
      type: "security",
      createdAt: new Date(),
    });
    return {
      message: "User created. Please check your email for verification code.",
    };
  }

  async verifyEmail({ email, code }: VerifyEmailDto) {
    return await this.prisma.$transaction(async (tx) => {
      const queryResult = await tx.$queryRaw<User[] | undefined>(
        Prisma.sql`SELECT * FROM "User" WHERE "email" = ${email} FOR UPDATE`,
      );
      if (queryResult == undefined || queryResult.length === 0) {
        throw new UnauthorizedException();
      }
      const user = queryResult[0]!;
      if (user.isVerified) {
        throw new BadRequestException("User is already verified");
      }

      if (user.verificationCode !== code) {
        throw new UnauthorizedException("Invalid verification code");
      }

      if (user.verificationCodeExpiresAt != undefined && user.verificationCodeExpiresAt < new Date()) {
        throw new UnauthorizedException("Verification code has expired");
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
        message: "Account Verified Successfully, please login",
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
    await this.notificationQueue.add("send-notification", {
      title: "Security Alert!",
      //todo:
      userId,
      email,
      message: `You have signedin with the wrong password 3 times ${Date()}`,
      type: "security",
      createdAt: new Date(),
    });
    return;
  }

  async signIn({ email, password: rawPassword }: SigninDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
      select: {
        password: true,
        id: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user.isVerified) {
      throw new UnauthorizedException("Please verify your email before logging in.");
    }

    const doesPasswordMatch = await this.hashingService.compare({
      raw: rawPassword,
      encrypted: user.password,
    });

    if (!doesPasswordMatch) {
      const userId = user.id;
      await this.handlePasswordNotMatch({ email, userId });
      throw new UnauthorizedException(ErrorMessages.PASSWORD_INCORRECT);
    }
    const signedData = {
      email,
      sub: user.id,
      role: user.role,
    };
    const { refreshTokenId, ...generatedTokens } = await this.generateTokens(signedData);
    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);
    return generatedTokens;
  }

  async signout({ refreshToken, password: rawPassword }: SignoutDto) {
    const { sub: userId } = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        password: true,
      },
    });

    const doesPasswordMatch = await this.hashingService.compare({
      raw: rawPassword,
      encrypted: user.password,
    });

    if (!doesPasswordMatch) {
      return new UnauthorizedException("Incorrect Password");
    }
    return await this.refreshTokenIdsStorage.invalidate(userId);
  }
  async refreshTokens({ refreshToken }: RefreshTokenDto) {
    const { refreshTokenId, sub: userId } = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken);
    const isValid = await this.refreshTokenIdsStorage.validate(userId, refreshTokenId);
    if (!isValid) {
      throw new UnauthorizedException("Refresh Token Expired");
    }
    await this.refreshTokenIdsStorage.invalidate(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        role: true,
        email: true,
      },
    });
    const newRefreshTokenPayload = {
      sub: userId,
      email: user.email,
      role: user.role,
    };
    const { refreshTokenId: oldRefreshTokenId, ...generateTokens } = await this.generateTokens(newRefreshTokenPayload);
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
    const [accessToken, refreshToken] = await Promise.all([
      this.signMethod(accessTokenPayload, this.config.getOrThrow("JWT_TTL", { infer: true })),
      this.signMethod(
        refreshTokenPayload,
        this.config.getOrThrow("JWT_REFRESH_TTL", {
          infer: true,
        }),
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshTokenId: refreshTokenPayload.refreshTokenId,
    };
  }
  private async signMethod(signedData: ActiveUserType | RefreshTokenPayload, expiresIn: DurationType) {
    return await this.jwtService.signAsync(signedData, {
      expiresIn,
    } satisfies JwtSignOptions);
  }
}

import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { PrismaService } from "@/prisma/prisma.service";
import { HashingService } from "@/hashing/hashing.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { ActiveUserSchema, ActiveUserType } from "../dto/request-user.dto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { NotificationsService } from "@/notification/notification.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly i18n: I18nService<I18nTranslations>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly notificationsService: NotificationsService,
  ) {
    super({
      usernameField: "email",
      passwordField: "password",
    });
  }

  private get prisma() {
    return this.prismaService.client;
  }

  override async validate(email: string, password: string): Promise<ActiveUserType> {
    const user = await this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        role: true,
        isVerified: true,
        language: true,
        passwordHash: true,
      },
    });

    if (!user || !user.isVerified) {
      await this.handlePasswordNotMatch({ email });
      throw new UnauthorizedException(this.i18n.t("errors.auth.invalidCredentials"));
    }

    const doesPasswordMatch = await this.hashingService.compare({
      raw: password,
      encrypted: user.passwordHash,
    });

    if (!doesPasswordMatch) {
      await this.handlePasswordNotMatch({ email, userId: user.id });
      throw new UnauthorizedException(this.i18n.t("errors.auth.invalidCredentials"));
    }

    return ActiveUserSchema.parse({
      sub: user.id,
      email,
      role: user.role,
      language: user.language,
      tokenType: "access",
    });
  }

  private async handlePasswordNotMatch({ email, userId }: { email: string; userId?: number }) {
    const key = `password-mismatch-${email}`;
    const res: number | undefined = await this.cacheManager.get(key);
    if (res == undefined) {
      await this.cacheManager.set(key, 1);
      return;
    }
    if (res < 3) {
      await this.cacheManager.set(key, res + 1);
      return;
    }
    if (userId == undefined) {
      return;
    }
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
}

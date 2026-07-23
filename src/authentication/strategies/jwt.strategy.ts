import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ActiveUserSchema, ActiveUserType } from "../dto/request-user.dto";
import { EnvVariables } from "@/common/schema/env";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<EnvVariables>,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow("JWT_SECRET", { infer: true }),
      audience: configService.get("JWT_AUDIENCE", { infer: true }),
      issuer: configService.get("JWT_ISSUER", { infer: true }),
      algorithms: ["HS256"],
      ignoreExpiration: false,
    });
  }

  validate(payload: object): ActiveUserType {
    const result = ActiveUserSchema.safeParse(payload);
    if (!result.success) {
      throw new UnauthorizedException(this.i18n.t("errors.auth.invalidToken"));
    }
    return result.data;
  }
}

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { Request } from "express";
import { RefreshTokenPayload, RefreshTokenPayloadSchema } from "../dto/request-user.dto";
import { EnvVariables } from "@/common/schema/env";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

const extractRefreshToken = (req: Request) => {
  const body = req.body as unknown;
  if (
    body != undefined &&
    typeof body === "object" &&
    "refresh_token" in body &&
    typeof body.refresh_token === "string"
  )
    return body.refresh_token;
  return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    configService: ConfigService<EnvVariables>,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    super({
      jwtFromRequest: extractRefreshToken,
      secretOrKey: configService.getOrThrow("JWT_SECRET", { infer: true }),
      audience: configService.get("JWT_AUDIENCE", { infer: true }),
      issuer: configService.get("JWT_ISSUER", { infer: true }),
      algorithms: ["HS256"],
      ignoreExpiration: false,
    });
  }

  override validate(payload: object): RefreshTokenPayload {
    const result = RefreshTokenPayloadSchema.safeParse(payload);
    if (!result.success) {
      throw new UnauthorizedException(this.i18n.t("errors.auth.invalidToken"));
    }
    return result.data;
  }
}

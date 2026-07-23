import { AppBaseExceptionFilter } from "@/common/app_filter";
import { UnauthorizedException } from "@nestjs/common";
import { JsonWebTokenError } from "@nestjs/jwt";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

export class JwtErrorFilter extends AppBaseExceptionFilter {
  constructor(private readonly i18n: I18nService<I18nTranslations>) {
    super();
  }
  override canHandle(exception: Error): boolean {
    return exception instanceof JsonWebTokenError;
  }

  override handle(_exception: JsonWebTokenError) {
    return new UnauthorizedException(this.i18n.t("errors.auth.invalidToken"));
  }
}

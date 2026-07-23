import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { JsonWebTokenError } from "@nestjs/jwt";
import { Keys } from "@/common/const";
import { ActiveUserType } from "../dto/request-user.dto";
import { RequestWithActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

@Injectable()
export class AuthenticationGuard extends AuthGuard("jwt") {
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext) {
    const IsPublic = this.reflector.getAllAndOverride<boolean | undefined>(Keys.IsPublic, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (IsPublic) {
      return true;
    }
    return (await super.canActivate(context)) as boolean;
  }

  override handleRequest<TUser = ActiveUserType>(
    err: Error | null,
    user: TUser | false,
    info: Error | null,
    context: ExecutionContext,
  ): TUser {
    if (err) {
      throw err;
    }
    if (!user) {
      if (info instanceof JsonWebTokenError) {
        throw new UnauthorizedException(this.i18n.t("errors.auth.invalidToken"));
      }
      throw new UnauthorizedException(this.i18n.t("errors.auth.accessTokenNotProvided"));
    }
    const req = context.switchToHttp().getRequest<RequestWithActiveUser>();
    req[Keys.User] = user as unknown as ActiveUserType;
    return user;
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Keys } from "@/common/const";
import { ActiveUserSchema } from "../dto/request-user.dto";
import { RequestWithActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { HashingService } from "@/hashing/hashing.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly hashingService: HashingService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const IsPublic = this.reflector.getAllAndOverride<boolean | undefined>(Keys.IsPublic, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (IsPublic) {
      return true;
    }
    const req = context.switchToHttp().getRequest<RequestWithActiveUser>();
    return this.validateTokenAndAssignUser(req);
  }

  async validateTokenAndAssignUser(req: RequestWithActiveUser): Promise<boolean> {
    const token = this.extractTokenFromHeader(req);
    if (token == undefined) {
      throw new UnauthorizedException(this.i18n.t("errors.auth.accessTokenNotProvided"));
    }
    const payLoad = await this.hashingService.verifyJwtToken(token);
    req[Keys.User] = ActiveUserSchema.parse(payLoad);
    return true;
  }
  private extractTokenFromHeader(req: RequestWithActiveUser): string | undefined {
    const [_, token] = req.headers.authorization?.split(" ") ?? [];
    return token;
  }
}

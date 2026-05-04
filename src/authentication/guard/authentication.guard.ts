import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AccessTokenGuard } from "./access-token.guard";
import { AuthType, Keys } from "@/common/const";

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly defaultAuthType = AuthType.BEARER;

  constructor(
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const IsPublic =
      this.reflector.getAllAndOverride<boolean | undefined>(Keys.IsPublic, [
        context.getHandler(),
        context.getClass(),
      ]) || this.defaultAuthType;
    if (IsPublic) {
      return true;
    } else {
      return this.accessTokenGuard.canActivate(context);
    }
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ErrorMessages, Keys } from "@/common/const";
import { ActiveUserSchema } from "../dto/request-user.dto";
import { RequestWithActiveUser } from "@/common/decorators/ActiveUser.decorator";
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const IsPublic = this.reflector.getAllAndOverride<boolean | undefined>(Keys.IsPublic, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (IsPublic) {
      console.log({ IsPublic });
      return true;
    } else {
      const req = context.switchToHttp().getRequest<RequestWithActiveUser>();
      return this.validateTokenAndAssignUser(req);
    }
  }

  async validateTokenAndAssignUser(req: RequestWithActiveUser): Promise<boolean> {
    const token = this.extractTokenFromHeader(req);
    if (token == undefined) {
      throw new UnauthorizedException(ErrorMessages.ACCESS_TOKEN_NOT_PROVIDED);
    }
    const payLoad: object = await this.jwtService.verifyAsync(token);
    req[Keys.User] = ActiveUserSchema.parse(payLoad);
    return true;
  }
  private extractTokenFromHeader(req: RequestWithActiveUser): string | undefined {
    const [_, token] = req.headers.authorization?.split(" ") ?? [];
    return token;
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ErrorMessages, Keys } from "@/common/const";
import { ActiveUserSchema } from "../dto/request-user.dto";
import { RequestWithActiveUser } from "@/iam/decorators/ActiveUser.decorator";
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithActiveUser>();
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

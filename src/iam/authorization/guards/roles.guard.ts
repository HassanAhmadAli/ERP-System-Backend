import { AuthType, Keys } from "@/common/const";
import { RequestWithActiveUser } from "@/iam/decorators/ActiveUser.decorator";
import { PrismaService } from "@/prisma";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@/prisma";
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const authType = this.reflector.getAllAndOverride<AuthType>(Keys.Auth, [context.getHandler(), context.getClass()]);
    if (authType === AuthType.NONE) return true;
    const allowedRoles = this.reflector.getAllAndMerge<Role[]>(Keys.Roles, [context.getHandler(), context.getClass()]);
    if (allowedRoles == undefined || allowedRoles.length === 0) {
      return true;
    }
    const req: RequestWithActiveUser = context.switchToHttp().getRequest<RequestWithActiveUser>();
    const user = req[Keys.User]!;
    if (user.role === "Debugging") return true;
    return allowedRoles.includes(user.role);
  }
}

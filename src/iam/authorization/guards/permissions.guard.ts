import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Permissions, PermissionsMap } from "../permission.type";
import { Keys } from "@/common/const";
import { RequestWithActiveUser } from "@/iam/decorators/ActiveUser.decorator";
import { Role } from "@/prisma";
import { env } from "@/common/env";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const contextPermissions = this.reflector.getAllAndOverride<Permissions[]>(Keys.Permissions, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (contextPermissions == undefined) {
      return true;
    }
    const { role } = context.switchToHttp().getRequest<RequestWithActiveUser>()[Keys.User]!;
    if (role === Role.Debugging) {
      return env!.NODE_ENV === "development";
    }
    for (const permission of contextPermissions) {
      if (!PermissionsMap[role].includes(permission)) return false;
    }
    return true;
  }
}

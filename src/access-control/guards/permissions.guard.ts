import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Permissions, PermissionsMap } from "../permission.type";
import { Keys } from "@/common/const";
import { RequestWithActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { logger } from "@/utils";

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
    logger.trace(`role is ${role}`);
    return contextPermissions.every((permission) => PermissionsMap[role].includes(permission));
  }
}

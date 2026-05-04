import { Keys } from "@/common/const";
import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@/prisma";
export const SetAllowedRoles = (...args: UserRole[]) => SetMetadata(Keys.Roles, args);

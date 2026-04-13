import { Keys } from "@/common/const";
import { SetMetadata } from "@nestjs/common";
import { Role } from "@/prisma";
export const SetAllowedRoles = (...args: Role[]) => SetMetadata(Keys.Roles, args);

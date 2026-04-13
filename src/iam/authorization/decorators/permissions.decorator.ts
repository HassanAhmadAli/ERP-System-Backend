import { SetMetadata } from "@nestjs/common";
import { Permissions } from "../permission.type";
import { Keys } from "@/common/const";
export const setPermissions = (...args: Permissions[]) => SetMetadata(Keys.Permissions, args);

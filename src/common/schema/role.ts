import { UserRole } from "@/prisma";
import z from "zod";
import { emptyToUndefined } from "./helper";
export const UserRoleSchema = z.enum(UserRole);
export const OptionalUserRoleSchema = emptyToUndefined(UserRoleSchema.optional());

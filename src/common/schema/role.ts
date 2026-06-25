import { UserRole } from "@/prisma/client";
import z from "zod";
import { emptyStringToUndefined } from "./helper";
export const UserRoleSchema = z.enum(UserRole);
export const OptionalUserRoleSchema = emptyStringToUndefined(UserRoleSchema.optional());

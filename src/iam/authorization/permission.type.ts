import { UserRole } from "@/prisma";

export const Permissions = {} as const;
export type Permissions = ValueOf<typeof Permissions>;
export const PermissionsMap: Record<UserRole, Permissions[]> = {
  CUSTOMER: [] satisfies Permissions[],
  ADMIN: [] satisfies Permissions[],
  EMPLOYEE: [] satisfies Permissions[],
  MANAGER: [] satisfies Permissions[],
};

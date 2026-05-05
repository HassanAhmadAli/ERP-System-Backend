import { UserRole } from "@/prisma";

export const Permissions = {
  updatePersonalProfile: "any:update-self-profile",
  //
  updateEmployeeProfile: "employee:update-profile",
  //
  archiveAccount: "account:archive",
  deleteAccount: "account:delete",
  viewUsersProfiles: "user:view-profiles",
  //
  updateAdminProfile: "admin:update-profile",
  //
} as const;
export type Permissions = ValueOf<typeof Permissions>;

const BASE_PERMISSIONS: Permissions[] = [Permissions.updatePersonalProfile];

export const PermissionsMap: Record<UserRole, Permissions[]> = {
  CUSTOMER: [...BASE_PERMISSIONS] satisfies Permissions[],
  ADMIN: [
    ...BASE_PERMISSIONS,
    Permissions.updateEmployeeProfile,
    Permissions.archiveAccount,
    Permissions.deleteAccount,
    Permissions.updateAdminProfile,
    Permissions.viewUsersProfiles,
  ] satisfies Permissions[],
  EMPLOYEE: [...BASE_PERMISSIONS] satisfies Permissions[],
  MANAGER: [...BASE_PERMISSIONS] satisfies Permissions[],
};

import { UserRole } from "@/prisma";

export const Permissions = {
  updatePersonalProfile: "update-personal-profile",
  updateEmployeeProfile: "update-employee-profile",
  archiveAccount: "archive-account",
  deleteAccount: "delete-account",
} as const;
export type Permissions = ValueOf<typeof Permissions>;
export const PermissionsMap: Record<UserRole, Permissions[]> = {
  CUSTOMER: [Permissions.updatePersonalProfile] satisfies Permissions[],
  ADMIN: [
    Permissions.updatePersonalProfile,
    Permissions.updateEmployeeProfile,
    Permissions.archiveAccount,
    Permissions.deleteAccount,
  ] satisfies Permissions[],
  EMPLOYEE: [Permissions.updatePersonalProfile] satisfies Permissions[],
  MANAGER: [Permissions.updatePersonalProfile] satisfies Permissions[],
};

import { UserRole } from "@/prisma";

export const Permissions = {
  //CUSTOMER:Start
  viewCustomerProfile: "customer:view-profile",
  //CUSTOMER:End
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
  addProduct: "product:create",
  manageCategories: "category:manage",
  manageSuppliers: "supplier:manage",
} as const;
export type Permissions = ValueOf<typeof Permissions>;

const BASE_PERMISSIONS: Permissions[] = [Permissions.updatePersonalProfile];

export const PermissionsMap: Record<UserRole, Permissions[]> = {
  CUSTOMER: [...BASE_PERMISSIONS, Permissions.viewCustomerProfile] satisfies Permissions[],
  ADMIN: [
    ...BASE_PERMISSIONS,
    Permissions.updateEmployeeProfile,
    Permissions.archiveAccount,
    Permissions.deleteAccount,
    Permissions.updateAdminProfile,
    Permissions.viewUsersProfiles,
    Permissions.addProduct,
    Permissions.manageCategories,
    Permissions.manageSuppliers,
  ] satisfies Permissions[],
  EMPLOYEE: [...BASE_PERMISSIONS] satisfies Permissions[],
  MANAGER: [...BASE_PERMISSIONS] satisfies Permissions[],
};

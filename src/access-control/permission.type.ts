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
  manageProduct: "product:manage",
  manageCategories: "category:manage",
  manageSuppliers: "supplier:manage",
  manageDiscounts: "discount:manage",
  createSales: "sales:create",
  viewSales: "sales:view",
  manageSales: "sales:manage",
  createOrder: "orders:create",
  viewOrders: "orders:view",
  manageOrders: "orders:manage",
  createPurchase: "purchases:create",
  viewPurchases: "purchases:view",
  managePurchases: "purchases:manage",
  manageExpenses: "expenses:manage",
  viewReports: "reports:view",
} as const;
export type Permissions = ValueOf<typeof Permissions>;

const BASE_PERMISSIONS: Permissions[] = [Permissions.updatePersonalProfile];

export const PermissionsMap: Record<UserRole, Permissions[]> = {
  CUSTOMER: [
    ...BASE_PERMISSIONS,
    Permissions.viewCustomerProfile,
    Permissions.createOrder,
    Permissions.viewOrders,
  ] satisfies Permissions[],
  ADMIN: [
    ...BASE_PERMISSIONS,
    Permissions.updateEmployeeProfile,
    Permissions.archiveAccount,
    Permissions.deleteAccount,
    Permissions.updateAdminProfile,
    Permissions.viewUsersProfiles,
    Permissions.addProduct,
    Permissions.manageProduct,
    Permissions.manageCategories,
    Permissions.manageSuppliers,
    Permissions.manageDiscounts,
    Permissions.createSales,
    Permissions.viewSales,
    Permissions.manageSales,
    Permissions.createOrder,
    Permissions.viewOrders,
    Permissions.manageOrders,
    Permissions.createPurchase,
    Permissions.viewPurchases,
    Permissions.managePurchases,
    Permissions.manageExpenses,
    Permissions.viewReports,
  ] satisfies Permissions[],
  EMPLOYEE: [
    ...BASE_PERMISSIONS,
    Permissions.createSales,
    Permissions.viewSales,
    Permissions.createOrder,
    Permissions.viewOrders,
    Permissions.manageOrders,
  ] satisfies Permissions[],
  MANAGER: [
    ...BASE_PERMISSIONS,
    Permissions.manageDiscounts,
    Permissions.manageProduct,
    Permissions.createSales,
    Permissions.viewSales,
    Permissions.manageSales,
    Permissions.createOrder,
    Permissions.viewOrders,
    Permissions.manageOrders,
    Permissions.createPurchase,
    Permissions.viewPurchases,
    Permissions.managePurchases,
    Permissions.manageExpenses,
    Permissions.viewReports,
  ] satisfies Permissions[],
};

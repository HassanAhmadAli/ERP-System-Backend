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
  manageEmployees: "employee:manage",
  //
  updateAdminProfile: "admin:update-profile",
  //
  addProduct: "product:create",
  manageProduct: "product:manage",
  importProducts: "product:import",
  manageCategories: "category:manage",
  manageSuppliers: "supplier:manage",
  manageDiscounts: "discount:manage",
  manageAds: "ads:manage",
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
  viewExpenses: "expenses:view",
  viewReports: "reports:view",
  exportReports: "reports:export",
  viewFinancials: "financials:view",
  manageFinancials: "financials:manage",
  viewCustomers: "customers:view",
  manageCustomerStatus: "customers:manage-status",
  manageCustomerLoyalty: "customers:manage-loyalty",
  manageLoyaltyRewards: "loyalty-rewards:manage",
  manageLoyaltyPolicy: "loyalty-policy:manage",
  viewAuditLogs: "audit-logs:view",
  sendNotifications: "notifications:send",
  viewNotificationHistory: "notifications:view-history",
} as const;
export type Permissions = ValueOf<typeof Permissions>;

const BASE_PERMISSIONS: Permissions[] = [Permissions.updatePersonalProfile];

const MANAGER_PERMISSIONS: Permissions[] = [
  ...BASE_PERMISSIONS,
  Permissions.addProduct,
  Permissions.manageProduct,
  Permissions.importProducts,
  Permissions.manageDiscounts,
  Permissions.manageAds,
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
  Permissions.viewExpenses,
  Permissions.viewReports,
  Permissions.exportReports,
  Permissions.viewCustomers,
  Permissions.manageCustomerStatus,
  Permissions.manageCustomerLoyalty,
  Permissions.manageLoyaltyRewards,
  Permissions.manageLoyaltyPolicy,
  Permissions.viewAuditLogs,
  Permissions.viewUsersProfiles,
  Permissions.manageEmployees,
  Permissions.sendNotifications,
  Permissions.viewNotificationHistory,
];

const ACCOUNTANT_PERMISSIONS: Permissions[] = [
  ...BASE_PERMISSIONS,
  Permissions.viewPurchases,
  Permissions.viewExpenses,
  Permissions.viewReports,
  Permissions.exportReports,
  Permissions.viewFinancials,
  Permissions.manageFinancials,
  Permissions.viewAuditLogs,
  Permissions.viewNotificationHistory,
];

export const PermissionsMap: Record<UserRole, Permissions[]> = {
  CUSTOMER: [
    ...BASE_PERMISSIONS,
    Permissions.viewCustomerProfile,
    Permissions.createOrder,
    Permissions.viewOrders,
  ] satisfies Permissions[],
  ADMIN: [
    // remove the following line later
    ...ACCOUNTANT_PERMISSIONS,
    // remove the following line later
    ...MANAGER_PERMISSIONS,
    Permissions.updateEmployeeProfile,
    Permissions.archiveAccount,
    Permissions.deleteAccount,
    Permissions.updateAdminProfile,
    Permissions.manageCategories,
    Permissions.manageSuppliers,
  ] satisfies Permissions[],
  EMPLOYEE: [
    ...BASE_PERMISSIONS,
    Permissions.createSales,
    Permissions.viewSales,
    Permissions.createOrder,
    Permissions.viewOrders,
    Permissions.manageOrders,
  ] satisfies Permissions[],
  MANAGER: MANAGER_PERMISSIONS satisfies Permissions[],
  ACCOUNTANT: ACCOUNTANT_PERMISSIONS satisfies Permissions[],
};

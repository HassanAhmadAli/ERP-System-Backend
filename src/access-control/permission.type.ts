import { UserRole } from "@/prisma/client";
export const Permissions = {
  updatePersonalProfile: "any:update-self-profile",
  updateCustomerPersonalProfile: "customer:update-self-profile",
  viewCustomerProfile: "customer:view-profile",
  createOrder: "orders:create",
  createCustomerOrder: "orders:create-customer-order",
  viewCustomerPersonalOrders: "orders:view-customer-personal",
  viewOrders: "orders:view",
  cancelOwnOrder: "orders:cancel-own",
  viewAvailableLoyaltyRewards: "loyalty-rewards:view",
  updateEmployeeProfile: "employee:update-profile",
  manageEmployees: "employee:manage",
  updateStoreManagerProfile: "store-manager:update-profile",
  viewUsersProfiles: "user:view-profiles",
  archiveAccount: "account:archive",
  deleteAccount: "account:delete",
  manageDiscounts: "discount:manage",
  manageAds: "ads:manage",
  manageCategories: "category:manage",
  viewReports: "reports:view",
  viewCustomers: "customers:view",
  manageCustomerStatus: "customers:manage-status",
  manageCustomerLoyalty: "customers:manage-loyalty",
  manageLoyaltyRewards: "loyalty-rewards:manage",
  manageLoyaltyPolicy: "loyalty-policy:manage",
  sendNotifications: "notifications:send",
  viewNotificationHistory: "notifications:view-history",
  viewSales: "sales:view",
  createSales: "sales:create",
  manageSales: "sales:manage",
  addProduct: "product:create",
  manageProduct: "product:manage",
  manageSuppliers: "supplier:manage",
  manageExpenses: "expenses:manage",
  viewExpenses: "expenses:view",
  viewFinancials: "financials:view",
  manageFinancials: "financials:manage",
  viewPurchases: "purchases:view",
  viewAuditLogs: "audit-logs:view",
  manageOrders: "orders:manage",
  managePurchases: "purchases:create",
} as const;
export type Permissions = ValueOf<typeof Permissions>;

const BASE_PERMISSIONS: Permissions[] = [Permissions.updatePersonalProfile];

const CASHIER_PERMISSIONS: Permissions[] = [
  ...BASE_PERMISSIONS,
  Permissions.createSales,
  Permissions.viewSales,
  Permissions.manageSales,
  Permissions.createOrder,
  Permissions.viewOrders,
  Permissions.manageOrders,
];

const WAREHOUSE_WORKER_PERMISSIONS: Permissions[] = [
  ...BASE_PERMISSIONS,
  Permissions.addProduct,
  Permissions.manageProduct,
  Permissions.manageCategories,
  Permissions.manageSuppliers,
];

const ACCOUNTANT_PERMISSIONS: Permissions[] = [
  ...BASE_PERMISSIONS,
  Permissions.manageExpenses,
  Permissions.viewExpenses,
  Permissions.viewReports,
  Permissions.viewFinancials,
  Permissions.manageFinancials,
  Permissions.viewAuditLogs,
  Permissions.sendNotifications,
  Permissions.manageSales,
  Permissions.manageDiscounts,
  Permissions.manageAds,
  Permissions.manageLoyaltyRewards,
  Permissions.manageLoyaltyPolicy,
  Permissions.viewCustomers,
  Permissions.viewPurchases,
  Permissions.managePurchases,
  Permissions.viewSales,
];

const CUSTOMER_PERMISSIONS: Permissions[] = [
  ...BASE_PERMISSIONS,
  Permissions.viewCustomerProfile,
  Permissions.createCustomerOrder,
  Permissions.viewCustomerPersonalOrders,
  Permissions.cancelOwnOrder,
  Permissions.viewAvailableLoyaltyRewards,
  Permissions.updateCustomerPersonalProfile,
];

const STORE_MANAGER_PERMISSIONS: Permissions[] = [
  ...BASE_PERMISSIONS,
  ...CASHIER_PERMISSIONS,
  ...WAREHOUSE_WORKER_PERMISSIONS,
  ...ACCOUNTANT_PERMISSIONS,
  Permissions.updateEmployeeProfile,
  Permissions.manageEmployees,
  Permissions.viewUsersProfiles,
  Permissions.updateStoreManagerProfile,
  Permissions.viewCustomers,
  Permissions.manageCustomerStatus,
  Permissions.manageCustomerLoyalty,
  Permissions.archiveAccount,
  Permissions.deleteAccount,
  Permissions.viewNotificationHistory,
];
export const PermissionsMap: Record<UserRole, Permissions[]> = {
  CUSTOMER: CUSTOMER_PERMISSIONS,
  STORE_MANAGER: STORE_MANAGER_PERMISSIONS,
  CASHIER: CASHIER_PERMISSIONS,
  WAREHOUSE_WORKER: WAREHOUSE_WORKER_PERMISSIONS,
  ACCOUNTANT: ACCOUNTANT_PERMISSIONS,
};

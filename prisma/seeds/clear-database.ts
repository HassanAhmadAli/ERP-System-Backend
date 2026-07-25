import type { PrismaTransactionClient } from "./data/generators";

export async function clearDatabase(tx: PrismaTransactionClient) {
  await tx.$executeRawUnsafe(`
    TRUNCATE TABLE
      "NotificationRecipient",
      "Notification",
      "AuditLog",
      "Expense",
      "ProductPhoto",
      "StoredFile",
      "OrderItem",
      "Order",
      "SaleItem",
      "SalesInvoice",
      "PurchaseItem",
      "PurchaseInvoice",
      "ProductImportJob",
      "Advertisement",
      "LoyaltyPolicy",
      "LoyaltyRedemption",
      "LoyaltyDiscountOffer",
      "Discount",
      "Product",
      "Supplier",
      "Category",
      "Customer",
      "Employee",
      "User",
      "errors"
    RESTART IDENTITY CASCADE;
  `);
}

import { prisma } from "./client-instance";

/** Wipes seed-related tables so `prisma db seed` is repeatable without migrate reset. */
export async function clearDatabase() {
  await prisma.$executeRawUnsafe(`
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

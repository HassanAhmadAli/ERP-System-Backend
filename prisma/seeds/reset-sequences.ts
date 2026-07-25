import type { PrismaTransactionClient } from "./data/generators";

const TABLES_WITH_SERIAL_ID = [
  "User",
  "Employee",
  "Customer",
  "Category",
  "Supplier",
  "Product",
  "SalesInvoice",
  "SaleItem",
  "PurchaseInvoice",
  "PurchaseItem",
  "Order",
  "OrderItem",
  "Discount",
  "Notification",
  "NotificationRecipient",
  "AuditLog",
  "Expense",
  "ProductPhoto",
  "Advertisement",
  "ProductImportJob",
  "errors",
] as const;

export async function resetSequences(tx: PrismaTransactionClient) {
  for (const table of TABLES_WITH_SERIAL_ID) {
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`,
    );
  }
}

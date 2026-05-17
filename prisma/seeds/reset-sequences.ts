import { prisma } from "./client-instance";

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
  "errors",
] as const;

/** Keeps autoincrement aligned after explicit `id` values in seed data. */
export async function resetSequences() {
  for (const table of TABLES_WITH_SERIAL_ID) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`,
    );
  }
}

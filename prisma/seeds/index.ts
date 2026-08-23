import "reflect-metadata";
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils";
import { logger } from "@/utils";
import { prisma } from "./client-instance";
import { NestFactory } from "@nestjs/core";
import { HashingService } from "@/hashing/hashing.service";
import { SeedModule } from "./seed-modules";
import { CATEGORY_COUNT, seedCategories } from "./categories";
import { SUPPLIER_COUNT, seedSuppliers } from "./suppliers";
import { seedStaff } from "./staff";
import { CUSTOMER_COUNT, seedCustomers } from "./customers";
import { PRODUCT_COUNT, seedProducts } from "./products";
import { DISCOUNT_COUNT, seedDiscounts } from "./discounts";
import { PURCHASE_INVOICES, seedPurchases } from "./purchases";
import { SALES_INVOICES, seedSales } from "./sales";
import { ORDER_ITEMS, ORDERS, seedOrders } from "./orders";
import { EXPENSE_COUNT, seedExpenses } from "./expenses";
import { seedLoyalty } from "./loyalty";
import { seedNotifications } from "./notifications";
import { auditLogsData, seedAuditLogs } from "./audit-logs";
import { seedProductPhotos } from "./product-photos";
import { adsData, seedAds } from "./ads";
import { productImportJobsData, seedProductImportJobs } from "./product-import-jobs";
import { resetSequences } from "./reset-sequences";
import { clearDatabase } from "./clear-database";

async function seed(hashingService: HashingService) {
  await prisma.$transaction(
    async (tx) => {
      await clearDatabase(tx);
      await seedCategories(tx);
      await seedSuppliers(tx);
      await seedStaff(tx, hashingService);
      await seedCustomers(tx, hashingService);
      await seedProducts(tx);
      await seedDiscounts(tx);
      await seedPurchases(tx);
      await seedSales(tx);
      await seedOrders(tx);
      await seedLoyalty(tx);
      await seedExpenses(tx);
      await seedAds(tx);
      await seedProductImportJobs(tx);
      await seedNotifications(tx);
      await seedAuditLogs(tx);
      await seedProductPhotos(tx);
      await resetSequences(tx);

      logger.info({
        caller: "seed",
        value: {
          categories: CATEGORY_COUNT,
          suppliers: SUPPLIER_COUNT,
          staffUsers: 5,
          customerUsers: CUSTOMER_COUNT,
          products: PRODUCT_COUNT,
          discounts: DISCOUNT_COUNT + 2,
          purchaseInvoices: PURCHASE_INVOICES.length,
          salesInvoices: SALES_INVOICES.length,
          orders: ORDERS.length,
          orderItems: ORDER_ITEMS.length,
          expenses: EXPENSE_COUNT,
          ads: adsData.length,
          importJobs: productImportJobsData.length,
          notifications: 4,
          auditLogs: auditLogsData.length,
        },
      });
    },
    { maxWait: 120000, timeout: 300000 },
  );
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const hashingService = app.get(HashingService);
  try {
    await seed(hashingService);
    logger.info({ caller: "seed", value: "Database seeded successfully" });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      logger.error({
        caller: "PrismaClientKnownRequestError",
        value: e.message,
      });
    } else {
      logger.error({
        caller: "unknown error",
        value: e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e),
      });
    }
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
}
void bootstrap();

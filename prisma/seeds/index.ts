import "reflect-metadata";
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils";
import { logger } from "@/utils";
import { prisma } from "./client-instance";
import { seedUsers } from "./user";
import { NestFactory } from "@nestjs/core";
import { HashingService } from "@/hashing/hashing.service";
import { SeedModule } from "./seed-modules";
import { seedCategory } from "./categories";
import { seedSuppliers } from "./suppliers";
import { seedProducts } from "./products";
import { seedDiscounts } from "./discounts";
import { seedPurchases } from "./purchases";
import { seedSales } from "./sales";
import { seedOrders } from "./orders";
import { seedExpenses } from "./expenses";
import { seedLoyaltyRewards } from "./loyalty-rewards";
import { seedLoyaltyPolicy } from "./loyalty-policy";
import { seedNotifications } from "./notifications";
import { seedAuditLogs } from "./audit-logs";
import { seedProductPhotos } from "./product-photos";
import { seedAds } from "./ads";
import { seedProductImportJobs } from "./product-import-jobs";
import { resetSequences } from "./reset-sequences";
import { clearDatabase } from "./clear-database";

async function seed(hashingService: HashingService) {
  await clearDatabase();
  await seedCategory();
  await seedSuppliers();
  await seedProducts();
  await seedUsers(hashingService);
  await seedDiscounts();
  await seedPurchases();
  await seedSales();
  await seedOrders();
  await seedExpenses();
  await seedLoyaltyRewards();
  await seedLoyaltyPolicy();
  await seedAds();
  await seedProductImportJobs();
  await seedNotifications();
  await seedAuditLogs();
  await seedProductPhotos();
  await resetSequences();
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
        value: e,
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

import "reflect-metadata";
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils";
import { logger } from "@/utils";
import { prisma } from "./client-instance";
import { NestFactory } from "@nestjs/core";
import { HashingService } from "@/hashing/hashing.service";
import { SeedModule } from "./seed-modules";
import { seedCategories } from "./categories";
import { seedSuppliers } from "./suppliers";
import { generateProductData } from "./products";
import { seedStaff } from "./staff";
import { seedCustomers } from "./customers";
import { seedDiscounts } from "./discounts";
import { seedPurchases } from "./purchases";
import { seedSales } from "./sales";
import { seedOrders } from "./orders";
import { seedExpenses } from "./expenses";
import { seedLoyaltyDiscountOffers } from "./loyalty-offers";
import { seedNotifications } from "./notifications";
import { seedAuditLogs } from "./audit-logs";
import { seedProductPhotos } from "./product-photos";
import { seedAds } from "./ads";
import { seedProductImportJobs } from "./product-import-jobs";
import { resetSequences } from "./reset-sequences";
import { clearDatabase } from "./clear-database";

async function seed(hashingService: HashingService) {
  const productData = generateProductData();

  await prisma.$transaction(
    async (tx) => {
      await clearDatabase(tx);
      await seedCategories(tx);
      await seedSuppliers(tx);
      await tx.product.createMany({ data: productData });
      await seedStaff(tx, hashingService);
      await seedCustomers(tx, hashingService);
      await seedDiscounts(tx);
      await seedPurchases(tx);
      await seedSales(tx);
      await seedOrders(tx);
      await seedExpenses(tx);
      await seedLoyaltyDiscountOffers(tx);
      await seedAds(tx);
      await seedProductImportJobs(tx);
      await seedNotifications(tx);
      await seedAuditLogs(tx);
      await seedProductPhotos(tx);
      await resetSequences(tx);
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
        value: e instanceof Error ? e.message : String(e),
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

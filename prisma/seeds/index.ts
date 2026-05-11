import "reflect-metadata";
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils";
import { logger } from "@/utils";
import { prisma } from "./client-instance";
import { seedUsers } from "./user";
import { NestFactory } from "@nestjs/core";
import { HashingService } from "@/hashing/hashing.service";
import { SeedModule } from "./seed-modules";
async function seed(hashingService: HashingService) {
  await seedUsers(hashingService);
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const hashingService = app.get(HashingService);
  try {
    await seed(hashingService);
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
    await prisma.$disconnect();
  }
}
void bootstrap();

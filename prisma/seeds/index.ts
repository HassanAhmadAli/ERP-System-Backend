import { PrismaClientKnownRequestError } from "@/prisma";

import { logger } from "@/utils";
import { prisma } from "./client-instance";
import { seedUsers } from "./user";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { HashingService } from "@/hashing/hashing.service";
async function seed(hashingService: HashingService) {
  await seedUsers(hashingService);
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
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

import { PrismaClientKnownRequestError } from "@/prisma";

import { logger } from "@/utils";
import { prisma } from "./client-instance";
import { seedUsers } from "./user";
async function seed() {
  await seedUsers();
}

async function bootstrap() {
  try {
    await seed();
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

import { PrismaClientKnownRequestError } from "@/prisma";

import { logger } from "@/utils";
import { prisma } from "./client-instance";

async function seed() {}

async function bootstrap() {
  try {
    await seed();
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      logger.error({
        caller: "PrismaClientKnownRequestError",
        value: e.message,
      });
    }
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
void bootstrap();

import { PrismaClientKnownRequestError } from "@/prisma";
import { seedUsers } from "./user";
import { seedDepartments } from "./department";
import { seedComplaints } from "./complaints";
import { logger } from "@/utils";
import { prisma } from "./client-instance";

async function seed() {
  await seedDepartments();
  await seedUsers();
  await seedComplaints();
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
    }
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
void bootstrap();

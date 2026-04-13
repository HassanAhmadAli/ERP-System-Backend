import { envSchema } from "@/common/schema/env";
import { Argon2Service } from "@/iam/hashing/argon2.service";
import { PrismaClient } from "@/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import z from "zod";
const { DATABASE_URL } = envSchema
  .pick({
    DATABASE_URL: true,
  })
  .parse(process.env);

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });
export const hashingService = new Argon2Service();

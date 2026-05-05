import { envSchema } from "@/common/schema/env";
import { PrismaClient } from "@/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
const { DATABASE_URL } = envSchema
  .pick({
    DATABASE_URL: true,
  })
  .parse(process.env);

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });

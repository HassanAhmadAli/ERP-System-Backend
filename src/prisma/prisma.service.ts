import { PrismaClient } from "./generated/prisma-client/client";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { softDeletePrismaExtension } from "./soft-delete";

export const createPrismaClient = ({ DATABASE_URL }: { DATABASE_URL: string }) => {
  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
    max: 20,
  });
  const prisma = new PrismaClient({
    adapter,
    log: ["query"],
  }).$extends(softDeletePrismaExtension);
  return prisma;
};
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: ReturnType<typeof createPrismaClient>;
  constructor(configService: ConfigService<EnvVariables>) {
    this.client = createPrismaClient({
      DATABASE_URL: configService.getOrThrow("DATABASE_URL", { infer: true }),
    });
  }

  async onModuleInit() {
    await this.client.$connect();
  }
  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}

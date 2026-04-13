import { Complaint, Prisma, PrismaClient } from "./generated/prisma-client/client";
import { ConflictException, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
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
  public readonly complaint = {
    async findForUpdate(tx: Pick<Prisma.TransactionClient, "$queryRaw">, complaintId: string) {
      const complaints = await tx.$queryRaw<Complaint[]>(
        Prisma.sql`SELECT * FROM "Complaint" WHERE "id" = ${complaintId} AND "Complaint"."deletedAt" IS NULL FOR UPDATE`,
      );
      if (complaints == undefined || complaints.length === 0 || complaints[0] == undefined) {
        throw new ConflictException("Complaint not found");
      }
      return complaints[0];
    },
  } as const;

  async onModuleInit() {
    await this.client.$connect();
  }
  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}

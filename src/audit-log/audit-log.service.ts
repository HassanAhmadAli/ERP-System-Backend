import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuditLogQueryDto } from "./dto/audit-log-query.dto";
import { Prisma } from "@/prisma";
import { paginated } from "@/common/types/paginated-response";

@Injectable()
export class AuditLogService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async findAll(query: AuditLogQueryDto) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.userId != undefined) {
      where.userId = query.userId;
    }
    if (query.entity != undefined) {
      where.entity = { contains: query.entity, mode: "insensitive" };
    }
    if (query.from != undefined || query.to != undefined) {
      where.performedAt = {};
      if (query.from != undefined) {
        where.performedAt.gte = query.from;
      }
      if (query.to != undefined) {
        where.performedAt.lte = query.to;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
        skip: query.offset,
        take: query.limit,
        orderBy: { performedAt: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginated(data, total);
  }
}

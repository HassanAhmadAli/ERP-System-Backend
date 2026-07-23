import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuditLogQueryDto } from "./dto/audit-log-query.dto";
import { Prisma } from "@/prisma/client";
import { paginated } from "@/common/types/paginated-response";
import { setAuditRecorder, AuditRecordParams } from "./audit-context";
import { convertObjecttoDbJson } from "@/utils";

@Injectable()
export class AuditLogService implements OnModuleInit {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  onModuleInit() {
    setAuditRecorder((params) => this.record(params));
  }

  async record({ userId, action, entity, entityId, oldValue, newValue }: AuditRecordParams) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue: convertObjecttoDbJson(oldValue),
        newValue: convertObjecttoDbJson(newValue),
      },
    });
  }

  async findAll(query: AuditLogQueryDto) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.userId != undefined) {
      where.userId = query.userId;
    }
    if (query.entity != undefined) {
      where.entity = { contains: query.entity, mode: "insensitive" };
    }
    if (query.action != undefined) {
      where.action = { contains: query.action, mode: "insensitive" };
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
          user: { select: { id: true, fullName: true, fullNameAr: true, email: true, role: true } },
        },
        skip: query.offset,
        take: query.limit,
        orderBy: { performedAt: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }
}

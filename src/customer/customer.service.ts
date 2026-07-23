import { UserRole, DiscountScope, Prisma } from "@/prisma/client";
import { BadRequestException, Injectable } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

import { UpdateCustomerProfileDto } from "./dto/update-profile.dto";
import { CustomerListQueryDto } from "./dto/customer-list-query.dto";
import { AdjustCustomerLoyaltyDto } from "./dto/adjust-customer-loyalty.dto";
import { UpdateCustomerStatusDto } from "./dto/update-customer-status.dto";
import { paginated } from "@/common/types/paginated-response";
import { deletedAt } from "@/common/dto/pagination-query.dto";
import { AuditAction } from "@/common/const";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class CustomerService {
  constructor(
    private prismaService: PrismaService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}
  get prisma() {
    return this.prismaService.client;
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        fullName: true,
        email: true,
        phoneNumber: true,
        language: true,
        customer: {
          where: { userId },
          select: {
            id: true,
            address: true,
            loyaltyPoints: true,
            totalSpent: true,
          },
        },
      },
    });

    const customerId = user.customer?.id;
    const activeDiscounts =
      customerId != undefined
        ? await this.prisma.discount.findMany({
            where: {
              scope: DiscountScope.CUSTOMER,
              customerId,
              isActive: true,
              startDate: { lte: new Date() },
              OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
              AND: [
                {
                  OR: [{ maxUses: null }, { usedCount: { lt: this.prisma.discount.fields.maxUses } }],
                },
              ],
            },
            select: {
              id: true,
              name: true,
              type: true,
              value: true,
              maxUses: true,
              usedCount: true,
              startDate: true,
              endDate: true,
            },
            orderBy: { endDate: "asc" },
          })
        : [];

    return { ...user, activeDiscounts };
  }

  async updateProfile(userId: number, dto: UpdateCustomerProfileDto) {
    const { address, ...userFields } = dto;
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...userFields,
        customer: {
          update: {
            where: { userId },
            data: { address },
          },
        },
      },
      select: {
        language: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        customer: {
          where: { userId },
          select: {
            address: true,
          },
        },
      },
    });
    return user;
  }

  async findAll(query: CustomerListQueryDto) {
    const where: Prisma.CustomerWhereInput = {
      user: { role: UserRole.CUSTOMER, deletedAt: deletedAt(query.deleted) },
    };

    if (query.search != undefined) {
      where.user!.OR = [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              isActive: true,
            },
          },
        },
        skip: query.offset,
        take: query.limit,
        orderBy: { id: "asc" },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }

  async findOne(customerId: number) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            isActive: true,
            createdAt: true,
          },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            subtotal: true,
            createdAt: true,
          },
        },
      },
    });

    return customer;
  }

  async updateStatus(customerId: number, dto: UpdateCustomerStatusDto) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: { user: { select: { id: true } } },
    });

    return this.prisma.user.update({
      where: { id: customer.user.id },
      data: { isActive: dto.isActive },
      select: { id: true, fullName: true, email: true, isActive: true },
    });
  }

  async adjustLoyalty(customerId: number, actorUserId: number, dto: AdjustCustomerLoyaltyDto) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    const nextPoints = customer.loyaltyPoints + dto.points;
    if (nextPoints < 0) {
      throw new BadRequestException(this.i18n.t("errors.customer.loyaltyPointsNegative"));
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: nextPoints },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: AuditAction.LOYALTY_ADJUSTMENT,
          entity: UserRole.CUSTOMER,
          entityId: String(customerId),
          oldValue: { loyaltyPoints: customer.loyaltyPoints, reason: dto.reason ?? null },
          newValue: { loyaltyPoints: nextPoints, delta: dto.points, reason: dto.reason ?? null },
        },
      });

      return updated;
    });
  }
}

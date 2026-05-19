import { PrismaService, UserRole } from "@/prisma";
import { BadRequestException, Injectable } from "@nestjs/common";
import { UpdateCustomerProfileDto } from "./dto/update-profile.dto";
import { CustomerListQueryDto } from "./dto/customer-list-query.dto";
import { AdjustCustomerLoyaltyDto } from "./dto/adjust-customer-loyalty.dto";
import { UpdateCustomerStatusDto } from "./dto/update-customer-status.dto";
import { Prisma } from "@/prisma";
import { paginated } from "@/common/types/paginated-response";
import { deletedAt } from "@/common/dto/pagination-query.dto";

@Injectable()
export class CustomerService {
  constructor(private prismaService: PrismaService) {}
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
        customer: {
          where: { userId },
          select: {
            address: true,
            loyaltyPoints: true,
            totalSpent: true,
          },
        },
      },
    });
    return user;
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

    return paginated(data, total);
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
            total: true,
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
      throw new BadRequestException("Loyalty points cannot be negative");
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
          action: "LOYALTY_ADJUSTMENT",
          entity: UserRole.CUSTOMER,
          entityId: customerId,
          oldValue: { loyaltyPoints: customer.loyaltyPoints, reason: dto.reason ?? null },
          newValue: { loyaltyPoints: nextPoints, delta: dto.points, reason: dto.reason ?? null },
        },
      });

      return updated;
    });
  }
}

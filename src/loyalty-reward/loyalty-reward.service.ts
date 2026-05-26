import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { NotificationsService } from "@/notification/notification.service";
import { CreateLoyaltyRewardDto } from "./dto/create-loyalty-reward.dto";
import { UpdateLoyaltyRewardDto } from "./dto/update-loyalty-reward.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { LoyaltyRewardWhereInput } from "@/prisma/generated/prisma-client/models";

@Injectable()
export class LoyaltyRewardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(data: CreateLoyaltyRewardDto) {
    return this.prisma.loyaltyReward.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.loyaltyReward.findMany({
        skip: query.offset,
        take: query.limit,
        orderBy: { pointsThreshold: "asc" },
      }),
      this.prisma.loyaltyReward.count(),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }

  async findAvailableForCustomer(userId: number, query: PaginationQueryDto) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { userId },
      select: { loyaltyPoints: true },
    });
    return await this.findAvailable(query, customer.loyaltyPoints);
  }

  async findAvailable(query: PaginationQueryDto, loyaltyPoints: number) {
    const where = { isActive: true } satisfies LoyaltyRewardWhereInput;
    const [data, total] = await Promise.all([
      this.prisma.loyaltyReward.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { pointsThreshold: "asc" },
      }),
      this.prisma.loyaltyReward.count({ where }),
    ]);

    return paginated(
      data.map((reward) => ({
        ...reward,
        canRedeem: loyaltyPoints >= reward.pointsThreshold,
      })),
      total,
      query.limit,
      query.offset,
    );
  }

  async findOne(id: string) {
    return await this.prisma.loyaltyReward.findUniqueOrThrow({ where: { id } });
  }

  async update(id: string, data: UpdateLoyaltyRewardDto) {
    await this.findOne(id);
    return this.prisma.loyaltyReward.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.loyaltyReward.delete({ where: { id } });
    return { message: `Loyalty reward ${id} deleted successfully` };
  }
}

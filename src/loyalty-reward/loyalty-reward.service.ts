import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateLoyaltyRewardDto } from "./dto/create-loyalty-reward.dto";
import { UpdateLoyaltyRewardDto } from "./dto/update-loyalty-reward.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";

@Injectable()
export class LoyaltyRewardService {
  constructor(private readonly prismaService: PrismaService) {}

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

    return paginated(data, total);
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

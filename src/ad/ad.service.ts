import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateAdDto } from "./dto/create-ad.dto";
import { UpdateAdDto } from "./dto/update-ad.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { Prisma } from "@/prisma";

@Injectable()
export class AdService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  create(data: CreateAdDto) {
    return this.prisma.advertisement.create({ data });
  }

  async findAll(paginationQuery: PaginationQueryDto, activeOnly: boolean) {
    const where: Prisma.AdvertisementWhereInput = {};
    if (activeOnly) {
      const now = new Date();
      where.isActive = true;
      where.startDate = { lte: now };
      where.OR = [{ endDate: null }, { endDate: { gte: now } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.advertisement.findMany({
        where,
        skip: paginationQuery.offset,
        take: paginationQuery.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.advertisement.count({ where }),
    ]);

    return paginated(data, total);
  }

  async findOne(id: number) {
    const ad = await this.prisma.advertisement.findUniqueOrThrow({ where: { id } });
    return ad;
  }

  update(id: number, dto: UpdateAdDto) {
    return this.findOne(id).then(() => this.prisma.advertisement.update({ where: { id }, data: dto }));
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.advertisement.delete({ where: { id } });
  }
}

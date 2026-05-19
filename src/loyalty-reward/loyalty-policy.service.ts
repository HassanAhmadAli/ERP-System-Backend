import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateLoyaltyPolicyDto } from "./dto/update-loyalty-policy.dto";
import { Prisma } from "@/prisma";

export const DEFAULT_POLICY = {
  id: 1,
  pointsPerCurrency: new Prisma.Decimal(1),
  currencyPerPoint: new Prisma.Decimal(1),
};

@Injectable()
export class LoyaltyPolicyService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async getPolicy() {
    const policy = await this.prisma.loyaltyPolicy.findUnique({ where: { id: 1 } });
    if (!policy) {
      return this.prisma.loyaltyPolicy.create({ data: DEFAULT_POLICY });
    }
    return policy;
  }

  async updatePolicy(data: UpdateLoyaltyPolicyDto) {
    await this.getPolicy();
    return this.prisma.loyaltyPolicy.update({
      where: { id: 1 },
      data,
    });
  }

  async calculateEarnedPoints(amount: Prisma.Decimal): Promise<number> {
    const policy = await this.getPolicy();
    return amount.mul(policy.pointsPerCurrency).floor().toNumber();
  }
}

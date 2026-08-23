import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { LoyaltyPolicyResponseDto, SetLoyaltyPolicyDto } from "./dto/loyalty-policy.dto";

const POLICY_ID = 1;
const DEFAULT_POINTS_PER_CURRENCY = 1;

@Injectable()
export class LoyaltyPolicyService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPolicy(): Promise<LoyaltyPolicyResponseDto> {
    const policy =
      (await this.prismaService.client.loyaltyPolicy.findUnique({ where: { id: POLICY_ID } })) ??
      (await this.prismaService.client.loyaltyPolicy.create({
        data: { id: POLICY_ID, pointsPerCurrency: DEFAULT_POINTS_PER_CURRENCY },
      }));

    return {
      pointsPerCurrency: policy.pointsPerCurrency.toNumber(),
      currencyPerPoint: policy.currencyPerPoint.toNumber(),
      updatedAt: policy.updatedAt,
    };
  }

  async setPolicy(dto: SetLoyaltyPolicyDto): Promise<LoyaltyPolicyResponseDto> {
    const policy = await this.prismaService.client.loyaltyPolicy.upsert({
      where: { id: POLICY_ID },
      create: { id: POLICY_ID, pointsPerCurrency: dto.pointsPerCurrency },
      update: { pointsPerCurrency: dto.pointsPerCurrency },
    });

    return {
      pointsPerCurrency: policy.pointsPerCurrency.toNumber(),
      currencyPerPoint: policy.currencyPerPoint.toNumber(),
      updatedAt: policy.updatedAt,
    };
  }
}

import { BadRequestException, Injectable } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

import { PrismaService } from "@/prisma/prisma.service";
import { CreateLoyaltyRewardDto } from "./dto/create-discount-offer.dto";
import { UpdateLoyaltyRewardDto } from "./dto/update-discount-offer.dto";
import { RedeemLoyaltyOfferDto } from "./dto/redeem-discount-offer.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { DiscountScope } from "@/prisma/client";
import { AuditAction } from "@/common/const";
import { AuditLogService } from "@/audit-log/audit-log.service";

@Injectable()
export class LoyaltyRewardService {
  constructor(
    private readonly prismaService: PrismaService,
    //todo: audit
    private readonly auditLogService: AuditLogService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(data: CreateLoyaltyRewardDto) {
    return this.prisma.loyaltyDiscountOffer.create({ data });
  }

  async findAll(query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.loyaltyDiscountOffer.findMany({
        skip: query.offset,
        take: query.limit,
        orderBy: { pointsCost: "asc" },
      }),
      this.prisma.loyaltyDiscountOffer.count(),
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
    const where = { isActive: true };
    const [data, total] = await Promise.all([
      this.prisma.loyaltyDiscountOffer.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { pointsCost: "asc" },
      }),
      this.prisma.loyaltyDiscountOffer.count({ where }),
    ]);

    return paginated(
      data.map((offer) => ({
        ...offer,
        canRedeem: loyaltyPoints >= offer.pointsCost,
      })),
      total,
      query.limit,
      query.offset,
    );
  }

  async findOne(id: string) {
    return await this.prisma.loyaltyDiscountOffer.findUniqueOrThrow({ where: { id } });
  }

  async update(id: string, data: UpdateLoyaltyRewardDto) {
    await this.findOne(id);
    return this.prisma.loyaltyDiscountOffer.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.loyaltyDiscountOffer.delete({ where: { id } });
    return { message: this.i18n.t("responses.loyalty.offerDeleted", { args: { id } }) };
  }

  async redeem(userId: number, { offerId }: RedeemLoyaltyOfferDto) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { userId },
      select: { id: true, loyaltyPoints: true, userId: true },
    });

    const offer = await this.prisma.loyaltyDiscountOffer.findUniqueOrThrow({
      where: { id: offerId },
    });

    if (!offer.isActive) {
      throw new BadRequestException(this.i18n.t("errors.loyalty.offerNotActive"));
    }

    if (customer.loyaltyPoints < offer.pointsCost) {
      throw new BadRequestException(this.i18n.t("errors.loyalty.insufficientPoints"));
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + offer.validityDays);

    return this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customer.id },
        data: { loyaltyPoints: { decrement: offer.pointsCost } },
      });

      const discount = await tx.discount.create({
        data: {
          name: `${offer.name} (Loyalty)`,
          nameAr: offer.nameAr ? `${offer.nameAr} (ولاء)` : undefined,
          type: offer.discountType,
          value: offer.discountValue,
          scope: DiscountScope.CUSTOMER,
          customerId: customer.id,
          maxUses: offer.maxUses,
          usedCount: 0,
          startDate,
          endDate,
          isActive: true,
          createdById: customer.userId,
        },
      });

      const redemption = await tx.loyaltyRedemption.create({
        data: {
          customerId: customer.id,
          offerId: offer.id,
          discountId: discount.id,
          pointsSpent: offer.pointsCost,
        },
        include: {
          offer: true,
          discount: true,
        },
      });

      await this.auditLogService.record({
        userId: customer.userId,
        action: AuditAction.LOYALTY_REDEMPTION,
        entity: "LoyaltyRedemption",
        entityId: redemption.id,
        oldValue: { loyaltyPoints: customer.loyaltyPoints },
        newValue: {
          loyaltyPoints: customer.loyaltyPoints - offer.pointsCost,
          pointsSpent: offer.pointsCost,
          discountId: discount.id,
          offerId: offer.id,
        },
      });

      return redemption;
    });
  }

  async findActiveCustomerDiscounts(customerId: number) {
    const now = new Date();
    return this.prisma.discount.findMany({
      where: {
        scope: DiscountScope.CUSTOMER,
        customerId,
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        AND: [
          {
            OR: [{ maxUses: null }, { usedCount: { lt: this.prisma.discount.fields.maxUses } }],
          },
        ],
      },
      orderBy: { endDate: "asc" },
    });
  }
}

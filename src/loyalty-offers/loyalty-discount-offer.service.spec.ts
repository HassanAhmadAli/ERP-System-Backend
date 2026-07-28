/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { mockDeep, DeepMockProxy, mock, MockProxy } from "jest-mock-extended";
import { Prisma, DiscountType, DiscountScope } from "@/prisma/client";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { AuditAction } from "@/common/const";
import { AuditLogService } from "@/audit-log/audit-log.service";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { LoyaltyRewardService } from "./loyalty-discount-offer.service";

describe("LoyaltyRewardService", () => {
  let service: LoyaltyRewardService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;
  let auditLogService: MockProxy<AuditLogService>;
  let i18n: MockProxy<I18nService<I18nTranslations>>;

  const mockOffer = {
    id: "offer-1",
    name: "10% Discount",
    nameAr: null,
    description: "Get 10% off",
    descriptionAr: null,
    pointsCost: 100,
    discountType: "PERCENTAGE" as DiscountType,
    discountValue: new Prisma.Decimal("10"),
    maxUses: 1,
    validityDays: 7,
    isActive: true,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  };

  const mockOffer2 = {
    ...mockOffer,
    id: "offer-2",
    name: "20% Discount",
    pointsCost: 200,
    discountValue: new Prisma.Decimal("20"),
  };

  const mockCustomer = {
    id: 1,
    userId: 10,
    address: "Address",
    addressAr: null,
    loyaltyPoints: 500,
    totalSpent: new Prisma.Decimal("0"),
  };

  const mockDiscount = {
    id: 1,
    name: "10% Discount (Loyalty)",
    nameAr: null,
    type: "PERCENTAGE" as DiscountType,
    value: new Prisma.Decimal("10"),
    scope: "CUSTOMER" as DiscountScope,
    maxInvoiceValue: new Prisma.Decimal("0"),
    maxUses: 1,
    usedCount: 0,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    productId: null,
    categoryId: null,
    customerId: 1,
    createdById: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRedemption = {
    id: "redemption-1",
    customerId: 1,
    offerId: "offer-1",
    discountId: 1,
    pointsSpent: 100,
    redeemedAt: new Date(),
    offer: mockOffer,
    discount: mockDiscount,
  };

  const defaultPagination = { limit: 10, offset: 0, deleted: false } satisfies PaginationQueryDto;

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();
    auditLogService = mock<AuditLogService>();
    i18n = mock<I18nService<I18nTranslations>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyRewardService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(LoyaltyRewardService);
  });

  describe("create", () => {
    const dto = {
      name: "10% Discount",
      nameAr: undefined,
      description: "Get 10% off",
      descriptionAr: undefined,
      pointsCost: 100,
      discountType: "PERCENTAGE" as DiscountType,
      discountValue: new Prisma.Decimal("10"),
      maxUses: 1,
      validityDays: 7,
      isActive: true,
    };

    it("creates a loyalty discount offer", async () => {
      prisma.loyaltyDiscountOffer.create.mockResolvedValue(mockOffer as never);

      const result = await service.create(dto);

      expect(result).toStrictEqual(mockOffer);
      expect(prisma.loyaltyDiscountOffer.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe("findAll", () => {
    it("returns paginated offers ordered by pointsCost asc", async () => {
      prisma.loyaltyDiscountOffer.findMany.mockResolvedValue([mockOffer, mockOffer2] as never);
      prisma.loyaltyDiscountOffer.count.mockResolvedValue(2);

      const result = await service.findAll(defaultPagination);

      expect(result).toStrictEqual({
        data: [mockOffer, mockOffer2],
        total: 2,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
      expect(prisma.loyaltyDiscountOffer.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { pointsCost: "asc" },
      });
      expect(prisma.loyaltyDiscountOffer.count).toHaveBeenCalled();
    });

    it("returns empty result when no offers exist", async () => {
      prisma.loyaltyDiscountOffer.findMany.mockResolvedValue([] as never);
      prisma.loyaltyDiscountOffer.count.mockResolvedValue(0);

      const result = await service.findAll(defaultPagination);

      expect(result).toStrictEqual({ data: [], total: 0, limit: 10, offset: 0, isFinalPage: true });
    });
  });

  describe("findAvailableForCustomer", () => {
    it("looks up customer loyaltyPoints and delegates to findAvailable", async () => {
      prisma.customer.findUniqueOrThrow.mockResolvedValue(mockCustomer as never);
      prisma.loyaltyDiscountOffer.findMany.mockResolvedValue([mockOffer, mockOffer2] as never);
      prisma.loyaltyDiscountOffer.count.mockResolvedValue(2);

      const result = await service.findAvailableForCustomer(10, defaultPagination);

      expect(prisma.customer.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { userId: 10 },
        select: { loyaltyPoints: true },
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0]!.canRedeem).toBe(true);
      expect(result.data[1]!.canRedeem).toBe(true);
    });

    it("propagates error when customer is not found", async () => {
      const error = new Error("Customer not found");
      prisma.customer.findUniqueOrThrow.mockRejectedValue(error as never);

      await expect(service.findAvailableForCustomer(999, defaultPagination)).rejects.toThrow(error);
    });
  });

  describe("findAvailable", () => {
    it("returns only active offers with canRedeem computed based on points", async () => {
      prisma.loyaltyDiscountOffer.findMany.mockResolvedValue([mockOffer, mockOffer2] as never);
      prisma.loyaltyDiscountOffer.count.mockResolvedValue(2);

      const result = await service.findAvailable(defaultPagination, 150);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]!.canRedeem).toBe(true);
      expect(result.data[1]!.canRedeem).toBe(false);
      expect(prisma.loyaltyDiscountOffer.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 10,
        orderBy: { pointsCost: "asc" },
      });
      expect(prisma.loyaltyDiscountOffer.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });

    it("returns empty result when no active offers", async () => {
      prisma.loyaltyDiscountOffer.findMany.mockResolvedValue([] as never);
      prisma.loyaltyDiscountOffer.count.mockResolvedValue(0);

      const result = await service.findAvailable(defaultPagination, 0);

      expect(result).toStrictEqual({ data: [], total: 0, limit: 10, offset: 0, isFinalPage: true });
    });
  });

  describe("findOne", () => {
    it("returns offer when found by string id", async () => {
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockResolvedValue(mockOffer as never);

      const result = await service.findOne("offer-1");

      expect(result).toStrictEqual(mockOffer);
      expect(prisma.loyaltyDiscountOffer.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "offer-1" },
      });
    });

    it("propagates P2025 error when offer is not found", async () => {
      const error = new Error("Record not found");
      (error as Record<string, unknown>).code = "P2025";
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockRejectedValue(error as never);

      await expect(service.findOne("nonexistent")).rejects.toMatchObject({ code: "P2025" });
    });
  });

  describe("update", () => {
    const updateDto = { name: "Updated Offer", pointsCost: 100 };

    it("updates an existing offer", async () => {
      const mockUpdated = { ...mockOffer, name: "Updated Offer" };
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockResolvedValue(mockOffer as never);
      prisma.loyaltyDiscountOffer.update.mockResolvedValue(mockUpdated as never);

      const result = await service.update("offer-1", updateDto);

      expect(result).toStrictEqual(mockUpdated);
      expect(prisma.loyaltyDiscountOffer.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "offer-1" },
      });
      expect(prisma.loyaltyDiscountOffer.update).toHaveBeenCalledWith({
        where: { id: "offer-1" },
        data: updateDto,
      });
    });

    it("throws when offer does not exist", async () => {
      const error = new Error("Not found");
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockRejectedValue(error as never);

      await expect(service.update("nonexistent", updateDto)).rejects.toThrow(error);
    });
  });

  describe("remove", () => {
    it("deletes offer and returns i18n confirmation message", async () => {
      i18n.t.mockReturnValue("Loyalty offer offer-1 deleted successfully");
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockResolvedValue(mockOffer as never);
      prisma.loyaltyDiscountOffer.delete.mockResolvedValue(mockOffer as never);

      const result = await service.remove("offer-1");

      expect(result).toStrictEqual({ message: "Loyalty offer offer-1 deleted successfully" });
      expect(prisma.loyaltyDiscountOffer.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "offer-1" },
      });
      expect(prisma.loyaltyDiscountOffer.delete).toHaveBeenCalledWith({
        where: { id: "offer-1" },
      });
      expect(i18n.t).toHaveBeenCalledWith("responses.loyalty.offerDeleted", {
        args: { id: "offer-1" },
      });
    });

    it("throws when offer does not exist", async () => {
      const error = new Error("Not found");
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockRejectedValue(error as never);

      await expect(service.remove("nonexistent")).rejects.toThrow(error);
    });
  });

  describe("redeem", () => {
    const redeemDto = { offerId: "offer-1" };

    it("completes full redemption flow in a transaction", async () => {
      prisma.customer.findUniqueOrThrow.mockResolvedValue(mockCustomer as never);
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockResolvedValue(mockOffer as never);

      const txClient = mockDeep<ReturnType<typeof createPrismaClient>>();
      txClient.customer.update.mockResolvedValue({
        ...mockCustomer,
        loyaltyPoints: mockCustomer.loyaltyPoints - mockOffer.pointsCost,
      } as never);
      txClient.discount.create.mockResolvedValue(mockDiscount as never);
      txClient.loyaltyRedemption.create.mockResolvedValue(mockRedemption as never);

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(txClient));

      const result = await service.redeem(10, redeemDto);

      expect(result).toStrictEqual(mockRedemption);
      expect(prisma.customer.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { userId: 10 },
        select: { id: true, loyaltyPoints: true, userId: true },
      });
      expect(prisma.loyaltyDiscountOffer.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "offer-1" },
      });
      expect(txClient.customer.update).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
        data: { loyaltyPoints: { decrement: mockOffer.pointsCost } },
      });
      expect(txClient.discount.create).toHaveBeenCalledWith({
        data: {
          name: `${mockOffer.name} (Loyalty)`,
          nameAr: undefined,
          type: mockOffer.discountType,
          value: mockOffer.discountValue,
          scope: DiscountScope.CUSTOMER,
          customerId: mockCustomer.id,
          maxUses: mockOffer.maxUses,
          usedCount: 0,
          startDate: expect.any(Date) as Date,
          endDate: expect.any(Date) as Date,
          isActive: true,
          createdById: mockCustomer.userId,
        },
      });
      expect(txClient.loyaltyRedemption.create).toHaveBeenCalledWith({
        data: {
          customerId: mockCustomer.id,
          offerId: mockOffer.id,
          discountId: mockDiscount.id,
          pointsSpent: mockOffer.pointsCost,
        },
        include: { offer: true, discount: true },
      });
      expect(auditLogService.record).toHaveBeenCalledWith({
        userId: mockCustomer.userId,
        action: AuditAction.LOYALTY_REDEMPTION,
        entity: "LoyaltyRedemption",
        entityId: mockRedemption.id,
        oldValue: { loyaltyPoints: mockCustomer.loyaltyPoints },
        newValue: {
          loyaltyPoints: mockCustomer.loyaltyPoints - mockOffer.pointsCost,
          pointsSpent: mockOffer.pointsCost,
          discountId: mockDiscount.id,
          offerId: mockOffer.id,
        },
      });
    });

    it("throws BadRequest when offer is not active", async () => {
      const inactiveOffer = { ...mockOffer, isActive: false };
      prisma.customer.findUniqueOrThrow.mockResolvedValue(mockCustomer as never);
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockResolvedValue(inactiveOffer as never);
      i18n.t.mockReturnValue("This loyalty offer is not active");

      await expect(service.redeem(10, redeemDto)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.loyalty.offerNotActive");
    });

    it("throws BadRequest when customer has insufficient loyalty points", async () => {
      const poorCustomer = { ...mockCustomer, loyaltyPoints: 50 };
      prisma.customer.findUniqueOrThrow.mockResolvedValue(poorCustomer as never);
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockResolvedValue(mockOffer as never);
      i18n.t.mockReturnValue("Insufficient loyalty points");

      await expect(service.redeem(10, redeemDto)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.loyalty.insufficientPoints");
    });

    it("propagates error when customer is not found", async () => {
      const error = new Error("Customer not found");
      prisma.customer.findUniqueOrThrow.mockRejectedValue(error as never);

      await expect(service.redeem(10, redeemDto)).rejects.toThrow(error);
    });

    it("propagates error when offer is not found", async () => {
      prisma.customer.findUniqueOrThrow.mockResolvedValue(mockCustomer as never);
      const error = new Error("Offer not found");
      prisma.loyaltyDiscountOffer.findUniqueOrThrow.mockRejectedValue(error as never);

      await expect(service.redeem(10, redeemDto)).rejects.toThrow(error);
    });
  });

  describe("findActiveCustomerDiscounts", () => {
    it("returns active customer-scope discounts with date and usage filters", async () => {
      prisma.discount.findMany.mockResolvedValue([mockDiscount] as never);

      const result = await service.findActiveCustomerDiscounts(1);

      expect(result).toStrictEqual([mockDiscount]);
      expect(prisma.discount.findMany).toHaveBeenCalledWith({
        where: {
          scope: DiscountScope.CUSTOMER,
          customerId: 1,
          isActive: true,
          startDate: { lte: expect.any(Date) as Date },
          OR: [{ endDate: null }, { endDate: { gte: expect.any(Date) as Date } }],
          AND: [
            {
              OR: [{ maxUses: null }, { usedCount: { lt: prisma.discount.fields.maxUses } }],
            },
          ],
        },
        orderBy: { endDate: "asc" },
      });
    });

    it("returns empty array when no matching discounts", async () => {
      prisma.discount.findMany.mockResolvedValue([] as never);

      const result = await service.findActiveCustomerDiscounts(1);

      expect(result).toStrictEqual([]);
    });
  });
});

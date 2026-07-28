/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { mockDeep, DeepMockProxy, mock } from "jest-mock-extended";
import { Prisma, DiscountType, DiscountScope } from "@/prisma/client";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { DiscountService } from "./discount.service";

describe("DiscountService", () => {
  let service: DiscountService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;
  let i18n: jest.Mocked<I18nService<I18nTranslations>>;
  let calculateDiscountSpy: jest.SpyInstance;

  const mockCreatedBy = { id: 1, fullName: "Admin User", fullNameAr: null };

  const mockDiscount = {
    id: 1,
    name: "Summer Sale 10%",
    nameAr: null,
    type: "PERCENTAGE" as DiscountType,
    value: new Prisma.Decimal("10"),
    scope: "GLOBAL" as DiscountScope,
    maxInvoiceValue: new Prisma.Decimal("0"),
    maxUses: 100,
    usedCount: 5,
    startDate: new Date("2024-01-01T00:00:00Z"),
    endDate: new Date("2027-12-31T00:00:00Z"),
    isActive: true,
    productId: null,
    categoryId: null,
    customerId: null,
    createdById: 1,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  };

  const mockDiscountWithCreatedBy = {
    ...mockDiscount,
    createdBy: mockCreatedBy,
  };

  const mockFixedAmountDiscount = {
    ...mockDiscount,
    id: 2,
    name: "Fixed $5 Off",
    type: "FIXED_AMOUNT" as DiscountType,
    value: new Prisma.Decimal("5"),
  };

  const mockProductDiscount = {
    ...mockDiscount,
    id: 3,
    name: "Product 10%",
    scope: "PRODUCT" as DiscountScope,
    productId: 10,
  };

  const mockCategoryDiscount = {
    ...mockDiscount,
    id: 4,
    name: "Category 10%",
    scope: "CATEGORY" as DiscountScope,
    categoryId: 20,
  };

  const mockCustomerDiscount = {
    ...mockDiscount,
    id: 5,
    name: "Customer 10%",
    scope: "CUSTOMER" as DiscountScope,
    customerId: 30,
  };

  const defaultPagination = { limit: 10, offset: 0, deleted: false };

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();
    i18n = mock<I18nService<I18nTranslations>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(DiscountService);
    calculateDiscountSpy = jest.spyOn(service, "calculateDiscount");
  });

  afterEach(() => {
    calculateDiscountSpy.mockRestore();
  });

  describe("create", () => {
    const userId = 1;
    const dto = {
      name: "Summer Sale 10%",
      type: "PERCENTAGE" as DiscountType,
      value: new Prisma.Decimal("10"),
      scope: "GLOBAL" as DiscountScope,
      maxInvoiceValue: new Prisma.Decimal("0"),
      startDate: new Date("2024-01-01"),
      isActive: true,
    };

    it("creates a GLOBAL discount and returns it with createdBy", async () => {
      prisma.discount.create.mockResolvedValue(mockDiscountWithCreatedBy as never);

      const result = await service.create(userId, dto);

      expect(result).toStrictEqual(mockDiscountWithCreatedBy);
      expect(prisma.discount.create).toHaveBeenCalledWith({
        data: { ...dto, createdById: userId },
        include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
      });
    });

    it("throws BadRequest when product does not exist", async () => {
      prisma.product.findUnique.mockResolvedValue(null as never);

      await expect(service.create(userId, { ...dto, scope: "PRODUCT", productId: 999 })).rejects.toThrow(
        BadRequestException,
      );

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.productNotExist", { args: { id: 999 } });
    });

    it("throws BadRequest when category does not exist", async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.category.findUnique.mockResolvedValue(null as never);

      await expect(
        service.create(userId, { ...dto, scope: "CATEGORY", productId: 1, categoryId: 999 }),
      ).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.categoryNotExist", { args: { id: 999 } });
    });

    it("throws BadRequest when customer does not exist", async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.category.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.customer.findUnique.mockResolvedValue(null as never);

      await expect(
        service.create(userId, { ...dto, scope: "CUSTOMER", productId: 1, categoryId: 1, customerId: 999 }),
      ).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.customerNotExist", { args: { id: 999 } });
    });

    it("throws BadRequest when PERCENTAGE value exceeds 100", async () => {
      await expect(
        service.create(userId, { ...dto, type: "PERCENTAGE", value: new Prisma.Decimal("150") }),
      ).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.percentageExceeds100");
    });
  });

  describe("findAll", () => {
    it("returns paginated discounts without search", async () => {
      prisma.discount.findMany.mockResolvedValue([mockDiscountWithCreatedBy] as never);
      prisma.discount.count.mockResolvedValue(1);

      const result = await service.findAll(defaultPagination);

      expect(result).toStrictEqual({
        data: [mockDiscountWithCreatedBy],
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
      expect(prisma.discount.findMany).toHaveBeenCalledWith({
        where: {},
        include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
      expect(prisma.discount.count).toHaveBeenCalledWith({ where: {} });
    });

    it("filters by search term on name and nameAr", async () => {
      prisma.discount.findMany.mockResolvedValue([] as never);
      prisma.discount.count.mockResolvedValue(0);

      await service.findAll(defaultPagination, "Summer");

      const arg = prisma.discount.findMany.mock.calls[0]![0]!;
      expect(arg.where!.OR).toStrictEqual([
        { name: { contains: "Summer", mode: "insensitive" } },
        { nameAr: { contains: "Summer", mode: "insensitive" } },
      ]);
    });

    it("returns empty result when no discounts match", async () => {
      prisma.discount.findMany.mockResolvedValue([] as never);
      prisma.discount.count.mockResolvedValue(0);

      const result = await service.findAll(defaultPagination, "NonExistent");

      expect(result).toStrictEqual({ data: [], total: 0, limit: 10, offset: 0, isFinalPage: true });
    });
  });

  describe("findOne", () => {
    it("returns discount when found", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockDiscountWithCreatedBy as never);

      const result = await service.findOne(1);

      expect(result).toStrictEqual(mockDiscountWithCreatedBy);
      expect(prisma.discount.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
      });
    });

    it("propagates rejection when discount not found", async () => {
      const error = new Error("Not found");
      prisma.discount.findUniqueOrThrow.mockRejectedValue(error as never);

      await expect(service.findOne(999)).rejects.toThrow(error);
    });
  });

  describe("update", () => {
    const updateDto = { name: "Updated Name" };

    it("updates a discount with simple field changes", async () => {
      const mockUpdated = { ...mockDiscountWithCreatedBy, name: "Updated Name" };
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockDiscount as never);
      prisma.discount.update.mockResolvedValue(mockUpdated as never);

      const result = await service.update(1, updateDto);

      expect(result).toStrictEqual(mockUpdated);
      expect(prisma.discount.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.discount.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
        include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
      });
    });

    it("throws BadRequest when scope is PRODUCT without productId", async () => {
      i18n.t.mockReturnValue("Product ID required");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        scope: "GLOBAL",
        productId: null,
      } as never);

      await expect(service.update(1, { scope: "PRODUCT" })).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.productIdRequired");
    });

    it("throws BadRequest when productId is provided for non-PRODUCT scope", async () => {
      i18n.t.mockReturnValue("Product ID not allowed");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        scope: "GLOBAL",
        productId: null,
      } as never);

      await expect(service.update(1, { productId: 10 })).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.productIdNotAllowed");
    });

    it("throws BadRequest when PERCENTAGE value exceeds 100", async () => {
      i18n.t.mockReturnValue("Percentage exceeds 100");
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockDiscount as never);

      await expect(service.update(1, { value: new Prisma.Decimal("150") })).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.percentageExceeds100");
    });

    it("throws BadRequest when endDate is before startDate", async () => {
      i18n.t.mockReturnValue("End date must be after start date");
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockDiscount as never);

      await expect(service.update(1, { endDate: new Date("2023-06-01") })).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.endDateAfterStart");
    });
  });

  describe("remove", () => {
    it("deletes the discount and returns a confirmation message", async () => {
      i18n.t.mockReturnValue("Discount deleted");
      prisma.discount.delete.mockResolvedValue(mockDiscount as never);

      const result = await service.remove(1);

      expect(result).toStrictEqual({ message: "Discount deleted" });
      expect(prisma.discount.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(i18n.t).toHaveBeenCalledWith("responses.discount.deleted", { args: { id: 1 } });
    });
  });

  describe("toggleActive", () => {
    it("sets isActive to true", async () => {
      const mockUpdated = { ...mockDiscountWithCreatedBy, isActive: true };
      prisma.discount.update.mockResolvedValue(mockUpdated as never);

      const result = await service.toggleActive(1, true);

      expect(result).toStrictEqual(mockUpdated);
      expect(prisma.discount.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: true },
        include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
      });
    });

    it("sets isActive to false", async () => {
      const mockUpdated = { ...mockDiscountWithCreatedBy, isActive: false };
      prisma.discount.update.mockResolvedValue(mockUpdated as never);

      const result = await service.toggleActive(1, false);

      expect(result).toStrictEqual(mockUpdated);
      expect(prisma.discount.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
        include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
      });
    });
  });

  describe("getActiveDiscounts", () => {
    it("returns active discounts without customer filter", async () => {
      prisma.discount.findMany.mockResolvedValue([mockDiscount] as never);
      prisma.discount.count.mockResolvedValue(1);

      const result = await service.getActiveDiscounts(defaultPagination);

      expect(result).toStrictEqual({
        data: [mockDiscount],
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
      const callArg = prisma.discount.findMany.mock.calls[0]![0]!;
      expect(callArg.where).toMatchObject({ scope: { not: DiscountScope.CUSTOMER } });
    });

    it("filters by customerId for CUSTOMER scope discounts", async () => {
      prisma.discount.findMany.mockResolvedValue([] as never);
      prisma.discount.count.mockResolvedValue(0);

      await service.getActiveDiscounts(defaultPagination, 30);

      const arg = prisma.discount.findMany.mock.calls[0]![0]!;
      expect(arg.where!.AND).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            OR: [{ scope: { not: DiscountScope.CUSTOMER } }, { scope: DiscountScope.CUSTOMER, customerId: 30 }],
          }),
        ]),
      );
    });

    it("returns empty result when no active discounts", async () => {
      prisma.discount.findMany.mockResolvedValue([] as never);
      prisma.discount.count.mockResolvedValue(0);

      const result = await service.getActiveDiscounts(defaultPagination);

      expect(result).toStrictEqual({ data: [], total: 0, limit: 10, offset: 0, isFinalPage: true });
    });
  });

  describe("calculateDiscount", () => {
    const dto = {
      discountId: 1,
      subtotal: new Prisma.Decimal("100"),
      productId: null,
      categoryId: null,
      customerId: null,
    };

    const expectedResult = {
      discountId: 1,
      discountName: "Summer Sale 10%",
      discountNameAr: null,
      type: "PERCENTAGE" as DiscountType,
      scope: "GLOBAL" as DiscountScope,
      subtotal: "100.00",
      discountAmount: 10,
      total: 90,
    };

    it("throws BadRequest when discount is not active", async () => {
      i18n.t.mockReturnValue("Discount not active");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({ ...mockDiscount, isActive: false } as never);

      await expect(service.calculateDiscount(dto)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.discount.notActive");
    });

    it("throws BadRequest when discount has not started yet", async () => {
      i18n.t.mockReturnValue("Discount not started");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        startDate: new Date("2099-01-01"),
      } as never);

      await expect(service.calculateDiscount(dto)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.discount.notStarted");
    });

    it("throws BadRequest when discount has expired", async () => {
      i18n.t.mockReturnValue("Discount expired");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        endDate: new Date("2020-01-01"),
      } as never);

      await expect(service.calculateDiscount(dto)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.discount.expired");
    });

    it("throws BadRequest when max uses have been reached", async () => {
      i18n.t.mockReturnValue("Max uses reached");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        maxUses: 100,
        usedCount: 100,
      } as never);

      await expect(service.calculateDiscount(dto)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.discount.maxUsesReached");
    });

    it("calculates PERCENTAGE discount without maxInvoiceValue cap", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockDiscount as never);

      const result = await service.calculateDiscount(dto);

      expect(result).toStrictEqual(expectedResult);
    });

    it("caps PERCENTAGE discount at maxInvoiceValue", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        maxInvoiceValue: new Prisma.Decimal("5"),
      } as never);

      const result = await service.calculateDiscount({ ...dto, subtotal: new Prisma.Decimal("200") });

      expect(result.discountAmount).toBe(5);
      expect(result.total).toBe(195);
    });

    it("calculates FIXED_AMOUNT discount", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockFixedAmountDiscount,
      } as never);

      const result = await service.calculateDiscount(dto);

      expect(result).toMatchObject({
        discountId: 2,
        type: "FIXED_AMOUNT",
        discountAmount: 5,
      });
    });

    it("caps discount amount at subtotal when discount exceeds subtotal", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockFixedAmountDiscount,
        value: new Prisma.Decimal("200"),
      } as never);

      const result = await service.calculateDiscount(dto);

      expect(result.discountAmount).toBe(100);
      expect(result.total).toBe(0);
    });

    it("throws BadRequest when productId missing for PRODUCT scope", async () => {
      i18n.t.mockReturnValue("Product ID required");
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockProductDiscount as never);

      await expect(service.calculateDiscount({ ...dto, discountId: 3, productId: null })).rejects.toThrow(
        BadRequestException,
      );

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.productIdRequiredApply");
    });

    it("throws BadRequest when product does not match PRODUCT scope", async () => {
      i18n.t.mockReturnValue("Not applicable to this product");
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockProductDiscount as never);

      await expect(service.calculateDiscount({ ...dto, discountId: 3, productId: 99 })).rejects.toThrow(
        BadRequestException,
      );

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.notApplicableToProduct");
    });

    it("throws BadRequest when categoryId missing for CATEGORY scope", async () => {
      i18n.t.mockReturnValue("Category ID required");
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockCategoryDiscount as never);

      await expect(service.calculateDiscount({ ...dto, discountId: 4, categoryId: null })).rejects.toThrow(
        BadRequestException,
      );

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.categoryIdRequiredApply");
    });

    it("throws BadRequest when customerId missing for CUSTOMER scope", async () => {
      i18n.t.mockReturnValue("Customer ID required");
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockCustomerDiscount as never);

      await expect(service.calculateDiscount({ ...dto, discountId: 5, customerId: null })).rejects.toThrow(
        BadRequestException,
      );

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.customerIdRequiredApply");
    });
  });

  describe("incrementUsage", () => {
    let mockTransactionClient: {
      discount: { findUniqueOrThrow: jest.Mock; update: jest.Mock };
    };

    beforeEach(() => {
      mockTransactionClient = {
        discount: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
      };
    });

    it("increments usedCount in the transaction", async () => {
      mockTransactionClient.discount.findUniqueOrThrow.mockResolvedValue(mockDiscount);
      mockTransactionClient.discount.update.mockResolvedValue({ ...mockDiscount, usedCount: 6 });

      const result = await service.incrementUsage(1, mockTransactionClient as never);

      expect(result).toStrictEqual({ ...mockDiscount, usedCount: 6 });
      expect(mockTransactionClient.discount.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { usedCount: { increment: 1 } },
      });
    });

    it("throws BadRequest when maxUses is reached", async () => {
      i18n.t.mockReturnValue("Max uses reached");
      mockTransactionClient.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        maxUses: 5,
        usedCount: 5,
      });

      await expect(service.incrementUsage(1, mockTransactionClient as never)).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.maxUsesReached");
      expect(mockTransactionClient.discount.update).not.toHaveBeenCalled();
    });
  });

  describe("validateDiscountUsable", () => {
    it("passes validation for a valid discount", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockDiscount as never);

      await expect(service.validateDiscountUsable(1)).resolves.toBeUndefined();
    });

    it("throws BadRequest when discount is not active", async () => {
      i18n.t.mockReturnValue("Not active");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({ ...mockDiscount, isActive: false } as never);

      await expect(service.validateDiscountUsable(1)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.discount.notActive");
    });

    it("throws BadRequest when discount has not started", async () => {
      i18n.t.mockReturnValue("Not started");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        startDate: new Date("2099-01-01"),
      } as never);

      await expect(service.validateDiscountUsable(1)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.discount.notStarted");
    });

    it("throws BadRequest when discount has expired", async () => {
      i18n.t.mockReturnValue("Expired");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        endDate: new Date("2020-01-01"),
      } as never);

      await expect(service.validateDiscountUsable(1)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.discount.expired");
    });

    it("throws BadRequest when max uses have been reached", async () => {
      i18n.t.mockReturnValue("Max uses reached");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockDiscount,
        maxUses: 100,
        usedCount: 100,
      } as never);

      await expect(service.validateDiscountUsable(1)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith("errors.discount.maxUsesReached");
    });
  });

  describe("getBestDiscount", () => {
    const subtotal = new Prisma.Decimal("100");
    const context = { customerId: null, productId: null, categoryId: null };

    it("returns null when no discounts are found", async () => {
      prisma.discount.findMany.mockResolvedValue([] as never);

      const result = await service.getBestDiscount(subtotal, context);

      expect(result).toBeNull();
    });

    it("picks the discount with the highest calculated amount", async () => {
      const lowDiscount = { ...mockDiscount, id: 1, name: "Low", value: new Prisma.Decimal("5") };
      const highDiscount = { ...mockDiscount, id: 2, name: "High", value: new Prisma.Decimal("20") };
      prisma.discount.findMany.mockResolvedValue([lowDiscount, highDiscount] as never);

      calculateDiscountSpy
        .mockResolvedValueOnce({
          discountId: 1,
          discountName: "Low",
          discountNameAr: null,
          type: "PERCENTAGE",
          scope: "GLOBAL",
          subtotal: "100.00",
          discountAmount: 5,
          total: 95,
        })
        .mockResolvedValueOnce({
          discountId: 2,
          discountName: "High",
          discountNameAr: null,
          type: "PERCENTAGE",
          scope: "GLOBAL",
          subtotal: "100.00",
          discountAmount: 20,
          total: 80,
        });

      const result = await service.getBestDiscount(subtotal, context);

      expect(result!.discountId).toBe(2);
      expect(result!.discountAmount).toBe(20);
    });

    it("skips discounts that fail validation via catch", async () => {
      const validDiscount = { ...mockDiscount, id: 2, name: "Valid 15%", value: new Prisma.Decimal("15") };
      const invalidDiscount = { ...mockDiscount, id: 1, name: "Invalid" };
      prisma.discount.findMany.mockResolvedValue([invalidDiscount, validDiscount] as never);

      calculateDiscountSpy.mockRejectedValueOnce(new BadRequestException("Not applicable")).mockResolvedValueOnce({
        discountId: 2,
        discountName: "Valid 15%",
        discountNameAr: null,
        type: "PERCENTAGE",
        scope: "GLOBAL",
        subtotal: "100.00",
        discountAmount: 15,
        total: 85,
      });

      const result = await service.getBestDiscount(subtotal, context);

      expect(result!.discountId).toBe(2);
    });
  });

  describe("calculateOrderDiscount", () => {
    const mockProductDb = { id: 10, sellingPrice: new Prisma.Decimal("50"), categoryId: 20 };
    const mockProductDb2 = { id: 11, sellingPrice: new Prisma.Decimal("30"), categoryId: 99 };

    it("returns 0 when discountId is undefined", async () => {
      const result = await service.calculateOrderDiscount({
        discountId: undefined,
        items: [{ productId: 10, quantity: 1 }],
      });

      expect(result).toStrictEqual(new Prisma.Decimal("0"));
    });

    it("returns 0 when discountId is null", async () => {
      const result = await service.calculateOrderDiscount({
        discountId: null,
        items: [{ productId: 10, quantity: 1 }],
      });

      expect(result).toStrictEqual(new Prisma.Decimal("0"));
    });

    it("applies PRODUCT scope discount to matching items", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockProductDiscount as never);
      prisma.product.findMany.mockResolvedValue([mockProductDb, mockProductDb2] as never);
      calculateDiscountSpy.mockResolvedValue({
        discountId: 3,
        discountName: "Product 10%",
        discountNameAr: null,
        type: "PERCENTAGE",
        scope: "PRODUCT",
        subtotal: "100.00",
        discountAmount: 10,
        total: 90,
      });

      const result = await service.calculateOrderDiscount({
        discountId: 3,
        items: [
          { productId: 10, quantity: 2 },
          { productId: 11, quantity: 1 },
        ],
      });

      expect(calculateDiscountSpy).toHaveBeenCalledWith(
        expect.objectContaining({ subtotal: new Prisma.Decimal("100") }) as object,
      );
      expect(result).toStrictEqual(new Prisma.Decimal("10"));
    });

    it("throws UnprocessableEntity when productId is null for PRODUCT scope", async () => {
      i18n.t.mockReturnValue("No product ID saved");
      prisma.discount.findUniqueOrThrow.mockResolvedValue({
        ...mockProductDiscount,
        productId: null,
      } as never);

      await expect(
        service.calculateOrderDiscount({
          discountId: 3,
          items: [{ productId: 10, quantity: 1 }],
        }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.noProductIdSaved");
    });

    it("throws BadRequest when required product is not in the order", async () => {
      i18n.t.mockReturnValue("Product not in order");
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockProductDiscount as never);

      await expect(
        service.calculateOrderDiscount({
          discountId: 3,
          items: [{ productId: 99, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.requiredProductNotInOrder");
    });

    it("applies CATEGORY scope discount to matching items", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockCategoryDiscount as never);
      prisma.product.findMany.mockResolvedValue([mockProductDb, mockProductDb2] as never);
      calculateDiscountSpy.mockResolvedValue({
        discountId: 4,
        discountName: "Category 10%",
        discountNameAr: null,
        type: "PERCENTAGE",
        scope: "CATEGORY",
        subtotal: "100.00",
        discountAmount: 10,
        total: 90,
      });

      const result = await service.calculateOrderDiscount({
        discountId: 4,
        items: [
          { productId: 10, quantity: 2 },
          { productId: 11, quantity: 1 },
        ],
      });

      expect(calculateDiscountSpy).toHaveBeenCalledWith(
        expect.objectContaining({ subtotal: new Prisma.Decimal("100") }) as object,
      );
      expect(result).toStrictEqual(new Prisma.Decimal("10"));
    });

    it("throws BadRequest when required category is not in items", async () => {
      i18n.t.mockReturnValue("Category not in order");
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockCategoryDiscount as never);
      prisma.product.findMany.mockResolvedValue([mockProductDb2] as never);

      await expect(
        service.calculateOrderDiscount({
          discountId: 4,
          items: [{ productId: 11, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.discount.requiredCategoryNotInOrder");
    });

    it("applies GLOBAL scope discount to all items", async () => {
      prisma.discount.findUniqueOrThrow.mockResolvedValue(mockDiscount as never);
      prisma.product.findMany.mockResolvedValue([mockProductDb, mockProductDb2] as never);
      calculateDiscountSpy.mockResolvedValue({
        discountId: 1,
        discountName: "Summer Sale 10%",
        discountNameAr: null,
        type: "PERCENTAGE",
        scope: "GLOBAL",
        subtotal: "130.00",
        discountAmount: 13,
        total: 117,
      });

      const result = await service.calculateOrderDiscount({
        discountId: 1,
        items: [
          { productId: 10, quantity: 2 },
          { productId: 11, quantity: 1 },
        ],
      });

      expect(calculateDiscountSpy).toHaveBeenCalledWith(
        expect.objectContaining({ subtotal: new Prisma.Decimal("130") }) as object,
      );
      expect(result).toStrictEqual(new Prisma.Decimal("13"));
    });
  });
});

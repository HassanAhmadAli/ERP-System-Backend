import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { mock, mockDeep, DeepMockProxy } from "jest-mock-extended";
import { Prisma, InvoiceStatus, UserRole } from "@/prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { SalesService } from "./sales.service";
import { CreateSalesInvoiceDto } from "./dto/create-sales-invoice.dto";
import { SalesInvoiceQueryDto } from "./dto/sales-invoice-query.dto";
import { DiscountService } from "@/discount/discount.service";
import { NotificationsService } from "@/notification/notification.service";

/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
describe("SalesService", () => {
  let service: SalesService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;
  let discountService: jest.Mocked<DiscountService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let i18n: jest.Mocked<I18nService<I18nTranslations>>;

  const mockEmployee = { id: 10, userId: 1 };
  const mockCustomer = { id: 5, userId: 10 };
  const mockProduct = {
    id: 1,
    name: "Product",
    nameAr: null,
    barcode: "123",
    categoryId: 1,
    sellingPrice: new Prisma.Decimal("100"),
    purchasePrice: new Prisma.Decimal("50"),
    quantityInStock: 100,
    minQuantity: 10,
    supplierId: 1,
  };
  const mockLoyaltyPolicy = {
    id: 1,
    pointsPerCurrency: new Prisma.Decimal("1"),
  };

  const mockInvoiceBase = {
    id: 1,
    cashierId: 10,
    customerId: 5,
    appliedDiscountId: null,
    subtotal: new Prisma.Decimal("200"),
    discountAmount: new Prisma.Decimal("0"),
    total: new Prisma.Decimal("200"),
    status: "PENDING" as InvoiceStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInvoice = {
    ...mockInvoiceBase,
    items: [
      {
        id: 1,
        invoiceId: 1,
        productId: 1,
        quantity: 2,
        unitPrice: new Prisma.Decimal("100"),
        discount: new Prisma.Decimal("0"),
        subtotal: new Prisma.Decimal("200"),
        product: { id: 1, name: "Product", nameAr: null, barcode: "123" },
      },
    ],
    cashier: {
      id: 10,
      userId: 1,
      user: { id: 1, fullName: "Cashier", fullNameAr: null, email: "cashier@test.com" },
    },
    customer: {
      id: 5,
      userId: 10,
      user: { id: 10, fullName: "Customer", fullNameAr: null, email: "customer@test.com" },
    },
    appliedDiscount: null,
  };

  const mockInvoiceWithItemsOnly = {
    ...mockInvoiceBase,
    items: [
      {
        id: 1,
        invoiceId: 1,
        productId: 1,
        quantity: 2,
        unitPrice: new Prisma.Decimal("100"),
        discount: new Prisma.Decimal("0"),
        subtotal: new Prisma.Decimal("200"),
      },
    ],
  };

  const mockTransactionClient = {
    product: { findMany: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
    salesInvoice: { create: jest.fn(), update: jest.fn() },
    user: { findMany: jest.fn() },
    customer: { update: jest.fn() },
    loyaltyPolicy: { findUnique: jest.fn() },
    discount: { update: jest.fn() },
  };

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();
    discountService = mock<DiscountService>();
    notificationsService = mock<NotificationsService>();
    i18n = mock<I18nService<I18nTranslations>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: DiscountService, useValue: discountService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(SalesService);
  });

  describe("create", () => {
    it("creates a PENDING invoice", async () => {
      const dto: CreateSalesInvoiceDto = {
        items: [{ productId: 1, quantity: 2 }],
        complete: false,
      };

      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      mockTransactionClient.salesInvoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create(1, dto);

      expect(result).toStrictEqual(mockInvoice);
      expect(mockTransactionClient.salesInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PENDING" }) as object,
        }),
      );
    });

    it("creates a COMPLETED invoice with completion effects", async () => {
      const dto: CreateSalesInvoiceDto = {
        items: [{ productId: 1, quantity: 2 }],
        complete: true,
      };

      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      mockTransactionClient.salesInvoice.create.mockResolvedValue(mockInvoice);
      mockTransactionClient.product.update.mockResolvedValue(mockProduct);
      mockTransactionClient.user.findMany.mockResolvedValue([]);
      mockTransactionClient.loyaltyPolicy.findUnique.mockResolvedValue(mockLoyaltyPolicy);
      mockTransactionClient.customer.update.mockResolvedValue(undefined);

      const result = await service.create(1, dto);

      expect(result).toStrictEqual(mockInvoice);
      expect(mockTransactionClient.salesInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "COMPLETED" }) as object,
        }),
      );
      expect(mockTransactionClient.product.update).toHaveBeenCalled();
      expect(mockTransactionClient.customer.update).toHaveBeenCalled();
    });

    it("validates and stores discount when discountAmount > 0", async () => {
      const dto: CreateSalesInvoiceDto = {
        customerId: 5,
        discountId: 1,
        items: [{ productId: 1, quantity: 2 }],
        complete: true,
      };

      const invoiceWithDiscount = {
        ...mockInvoice,
        appliedDiscountId: 1,
        discountAmount: new Prisma.Decimal("20"),
        total: new Prisma.Decimal("180"),
        appliedDiscount: { id: 1, name: "10% Off", nameAr: null },
      };

      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      prisma.customer.findUniqueOrThrow.mockResolvedValue(mockCustomer as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("20"));
      discountService.validateDiscountUsable.mockResolvedValue(undefined);
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      mockTransactionClient.salesInvoice.create.mockResolvedValue(invoiceWithDiscount);
      mockTransactionClient.product.update.mockResolvedValue(mockProduct);
      mockTransactionClient.user.findMany.mockResolvedValue([]);
      mockTransactionClient.loyaltyPolicy.findUnique.mockResolvedValue(mockLoyaltyPolicy);
      mockTransactionClient.customer.update.mockResolvedValue(undefined);

      const result = await service.create(1, dto);

      expect(result).toStrictEqual(invoiceWithDiscount);
      expect(discountService.calculateOrderDiscount).toHaveBeenCalledWith({
        discountId: 1,
        customerId: 5,
        items: dto.items,
      });
      expect(discountService.validateDiscountUsable).toHaveBeenCalledWith(1);
      expect(discountService.incrementUsage).toHaveBeenCalled();
    });

    it("skips discount validation when calculated amount is zero", async () => {
      const dto: CreateSalesInvoiceDto = {
        discountId: 1,
        items: [{ productId: 1, quantity: 2 }],
        complete: true,
      };

      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("0"));
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      mockTransactionClient.salesInvoice.create.mockResolvedValue(mockInvoice);
      mockTransactionClient.product.update.mockResolvedValue(mockProduct);
      mockTransactionClient.user.findMany.mockResolvedValue([]);
      mockTransactionClient.loyaltyPolicy.findUnique.mockResolvedValue(null);
      mockTransactionClient.customer.update.mockResolvedValue(undefined);

      await service.create(1, dto);

      expect(discountService.validateDiscountUsable).not.toHaveBeenCalled();
      expect(discountService.incrementUsage).not.toHaveBeenCalled();
    });

    it("throws when employee is not found", async () => {
      const dto: CreateSalesInvoiceDto = {
        items: [{ productId: 1, quantity: 2 }],
        complete: false,
      };

      prisma.employee.findUniqueOrThrow.mockRejectedValue(new Error("Employee not found"));

      await expect(service.create(999, dto)).rejects.toThrow("Employee not found");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws when customer is not found", async () => {
      const dto: CreateSalesInvoiceDto = {
        customerId: 999,
        items: [{ productId: 1, quantity: 2 }],
        complete: false,
      };

      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      prisma.customer.findUniqueOrThrow.mockRejectedValue(new Error("Customer not found"));

      await expect(service.create(1, dto)).rejects.toThrow("Customer not found");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws BadRequest when products are not found", async () => {
      const dto: CreateSalesInvoiceDto = {
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        complete: false,
      };

      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      i18n.t.mockReturnValue("Some products were not found");

      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequest when stock is insufficient for COMPLETED invoice", async () => {
      const dto: CreateSalesInvoiceDto = {
        items: [{ productId: 1, quantity: 200 }],
        complete: true,
      };

      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      i18n.t.mockReturnValue("Insufficient stock");

      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
    });

    it("propagates rejection from $transaction", async () => {
      const dto: CreateSalesInvoiceDto = {
        items: [{ productId: 1, quantity: 2 }],
        complete: false,
      };

      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      prisma.$transaction.mockRejectedValue(new Error("Transaction failed"));

      await expect(service.create(1, dto)).rejects.toThrow("Transaction failed");
    });
  });

  describe("findAll", () => {
    it("returns paginated invoices with no filters", async () => {
      prisma.salesInvoice.findMany.mockResolvedValue([mockInvoice] as never);
      prisma.salesInvoice.count.mockResolvedValue(1);
      const query: SalesInvoiceQueryDto = { limit: 10, offset: 0, deleted: false };

      const result = await service.findAll(query);

      expect(result).toMatchObject({ data: [mockInvoice], total: 1, limit: 10, offset: 0, isFinalPage: true });
      expect(prisma.salesInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 10,
          orderBy: { createdAt: "desc" },
        }),
      );
    });

    it("filters by status", async () => {
      prisma.salesInvoice.findMany.mockResolvedValue([] as never);
      prisma.salesInvoice.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, deleted: false, status: "COMPLETED" });

      expect(prisma.salesInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: "COMPLETED" }) }) as object,
      );
    });

    it("filters by cashierId", async () => {
      prisma.salesInvoice.findMany.mockResolvedValue([] as never);
      prisma.salesInvoice.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, deleted: false, cashierId: 10 });

      expect(prisma.salesInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ cashierId: 10 }) }) as object,
      );
    });

    it("filters by date range", async () => {
      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");
      prisma.salesInvoice.findMany.mockResolvedValue([] as never);
      prisma.salesInvoice.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, deleted: false, from, to });

      expect(prisma.salesInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: from, lte: to },
          }),
        }),
      );
    });

    it("returns empty results when no invoices match", async () => {
      prisma.salesInvoice.findMany.mockResolvedValue([] as never);
      prisma.salesInvoice.count.mockResolvedValue(0);

      const result = await service.findAll({ limit: 10, offset: 0, deleted: false });

      expect(result).toMatchObject({ data: [], total: 0, isFinalPage: true });
    });
  });

  describe("findOne", () => {
    it("returns invoice when found", async () => {
      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoice as never);

      const result = await service.findOne(1);

      expect(result).toStrictEqual(mockInvoice);
    });

    it("propagates rejection when not found", async () => {
      prisma.salesInvoice.findUniqueOrThrow.mockRejectedValue(new Error("Not found"));

      await expect(service.findOne(999)).rejects.toThrow("Not found");
    });
  });

  describe("updateStatus", () => {
    it("throws ForbiddenException when CASHIER tries to update another's invoice", async () => {
      const otherEmployee = { id: 99 };

      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoiceWithItemsOnly as never);
      prisma.employee.findUniqueOrThrow.mockResolvedValue(otherEmployee as never);
      i18n.t.mockReturnValue("Can only update own invoices");

      await expect(service.updateStatus(1, { status: "COMPLETED" }, 1, UserRole.CASHIER)).rejects.toThrow(
        ForbiddenException,
      );

      expect(prisma.employee.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { userId: 1 },
        select: { id: true },
      });
    });

    it("throws BadRequest for terminal status CANCELLED", async () => {
      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue({
        ...mockInvoiceWithItemsOnly,
        status: "CANCELLED",
      } as never);
      i18n.t.mockReturnValue("Cannot update status");

      await expect(service.updateStatus(1, { status: "COMPLETED" }, 1, UserRole.STORE_MANAGER)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws BadRequest for terminal status REFUNDED", async () => {
      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue({
        ...mockInvoiceWithItemsOnly,
        status: "REFUNDED",
      } as never);
      i18n.t.mockReturnValue("Cannot update status");

      await expect(service.updateStatus(1, { status: "COMPLETED" }, 1, UserRole.STORE_MANAGER)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("returns existing invoice when status unchanged (no-op)", async () => {
      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoiceWithItemsOnly as never);
      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoice as never);

      const result = await service.updateStatus(1, { status: "PENDING" }, 1, UserRole.STORE_MANAGER);

      expect(result).toStrictEqual(mockInvoice);
    });

    it("transitions PENDING to COMPLETED with stock check and completion effects", async () => {
      const completedInvoice = { ...mockInvoice, status: "COMPLETED" as InvoiceStatus };

      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoiceWithItemsOnly as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      mockTransactionClient.product.findUniqueOrThrow.mockResolvedValue(mockProduct);
      mockTransactionClient.salesInvoice.update.mockResolvedValue(completedInvoice);
      mockTransactionClient.product.update.mockResolvedValue(mockProduct);
      mockTransactionClient.user.findMany.mockResolvedValue([]);
      mockTransactionClient.loyaltyPolicy.findUnique.mockResolvedValue(mockLoyaltyPolicy);
      mockTransactionClient.customer.update.mockResolvedValue(undefined);

      const result = await service.updateStatus(1, { status: "COMPLETED" }, 1, UserRole.STORE_MANAGER);

      expect(result).toStrictEqual(completedInvoice);
      expect(mockTransactionClient.salesInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { status: "COMPLETED" },
        }),
      );
    });

    it("throws BadRequest when PENDING→COMPLETED with insufficient stock", async () => {
      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoiceWithItemsOnly as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      mockTransactionClient.product.findUniqueOrThrow.mockResolvedValue({ ...mockProduct, quantityInStock: 1 });
      i18n.t.mockReturnValue("Insufficient stock");

      await expect(service.updateStatus(1, { status: "COMPLETED" }, 1, UserRole.STORE_MANAGER)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("transitions COMPLETED to REFUNDED with refund effects", async () => {
      const completedInvoice = {
        ...mockInvoiceWithItemsOnly,
        status: "COMPLETED" as InvoiceStatus,
      };
      const refundedInvoice = { ...mockInvoice, status: "REFUNDED" as InvoiceStatus };

      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(completedInvoice as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      mockTransactionClient.salesInvoice.update.mockResolvedValue(refundedInvoice);
      mockTransactionClient.product.update.mockResolvedValue(mockProduct);
      mockTransactionClient.loyaltyPolicy.findUnique.mockResolvedValue(mockLoyaltyPolicy);
      mockTransactionClient.customer.update.mockResolvedValue(undefined);

      const result = await service.updateStatus(1, { status: "REFUNDED" }, 1, UserRole.STORE_MANAGER);

      expect(result).toStrictEqual(refundedInvoice);
      expect(mockTransactionClient.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { quantityInStock: { increment: 2 } },
        }),
      );
    });

    it("throws BadRequest for invalid transition PENDING→REFUNDED", async () => {
      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoiceWithItemsOnly as never);
      i18n.t.mockReturnValue("Invalid status transition");

      await expect(service.updateStatus(1, { status: "REFUNDED" }, 1, UserRole.STORE_MANAGER)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("allows PENDING→CANCELLED", async () => {
      const cancelledInvoice = { ...mockInvoice, status: "CANCELLED" as InvoiceStatus };

      prisma.salesInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoiceWithItemsOnly as never);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient as never));
      mockTransactionClient.salesInvoice.update.mockResolvedValue(cancelledInvoice);

      const result = await service.updateStatus(1, { status: "CANCELLED" }, 1, UserRole.STORE_MANAGER);

      expect(result).toStrictEqual(cancelledInvoice);
    });
  });
});

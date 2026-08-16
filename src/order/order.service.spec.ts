/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { mockDeep, DeepMockProxy, mock } from "jest-mock-extended";
import { Prisma, OrderStatus, UserRole } from "@/prisma/client";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { DiscountService } from "@/discount/discount.service";
import { NotificationsService } from "@/notification/notification.service";
import { OrderService } from "./order.service";

describe("OrderService", () => {
  let service: OrderService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;
  let i18n: jest.Mocked<I18nService<I18nTranslations>>;
  let discountService: jest.Mocked<DiscountService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  // ---- Fixtures ----
  const now = new Date();

  const mockUser = { id: 10, fullName: "User", fullNameAr: null, email: "user@test.com" };

  const mockFullUser = {
    id: 10,
    fullName: "User",
    fullNameAr: null,
    email: "user@test.com",
    phoneNumber: "+123",
    isActive: true,
    language: "en",
    role: UserRole.CUSTOMER,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const mockCustomer = {
    id: 5,
    userId: 10,
    address: "123 St",
    addressAr: null,
    loyaltyPoints: 0,
    totalSpent: new Prisma.Decimal("0"),
  };

  const mockCustomerWithUser = {
    ...mockCustomer,
    user: { id: 10, email: "user@test.com" },
  };

  const mockProduct = {
    id: 1,
    name: "Product A",
    nameAr: null,
    barcode: "123",
    categoryId: 1,
    quantityInStock: 10,
    sellingPrice: new Prisma.Decimal("100"),
    purchasePrice: new Prisma.Decimal("0"),
    minQuantity: 1,
  };

  const mockProductSelect = { id: 1, name: "Product A", nameAr: null, barcode: "123" };

  const mockOrderItemRaw = {
    id: 1,
    productId: 1,
    quantity: 2,
    unitPrice: new Prisma.Decimal("100"),
    subtotal: new Prisma.Decimal("200"),
  };

  const mockOrderItemWithProduct = {
    ...mockOrderItemRaw,
    product: mockProductSelect,
  };

  const baseOrder = {
    id: 1,
    customerId: 5,
    subtotal: new Prisma.Decimal("200"),
    discountAmount: new Prisma.Decimal("0"),
    total: new Prisma.Decimal("200"),
    appliedDiscountId: null,
    deliveryAddress: "123 St",
    deliveryAddressAr: null,
    createdAt: now,
    updatedAt: now,
  };

  const mockOrderWithIncludes = {
    ...baseOrder,
    status: OrderStatus.PENDING,
    items: [mockOrderItemWithProduct],
    customer: { ...mockCustomer, user: mockUser },
    appliedDiscount: null,
  };

  const mockOrderForUpdate = {
    ...baseOrder,
    status: OrderStatus.PENDING,
    items: [mockOrderItemRaw],
    customer: { ...mockCustomer, user: mockFullUser },
  };

  const _mockDeliveredOrderForUpdate = {
    ...baseOrder,
    status: OrderStatus.DELIVERED,
    appliedDiscountId: 1,
    items: [mockOrderItemRaw],
    customer: { ...mockCustomer, user: mockFullUser },
  };

  const mockPreparingOrderForUpdate = {
    ...baseOrder,
    status: OrderStatus.PREPARING,
    items: [mockOrderItemRaw],
    customer: { ...mockCustomer, user: mockFullUser },
  };

  const mockOutForDeliveryOrderForUpdate = {
    ...baseOrder,
    status: OrderStatus.OUT_FOR_DELIVERY,
    appliedDiscountId: 1,
    items: [mockOrderItemRaw],
    customer: { ...mockCustomer, user: mockFullUser },
  };

  let mockTx: {
    product: { findMany: jest.Mock; findUniqueOrThrow: jest.Mock; update: jest.Mock };
    order: { create: jest.Mock; update: jest.Mock };
    discount: { update: jest.Mock };
  };

  const defaultQuery = { limit: 10, offset: 0, deleted: false };

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();
    i18n = mock<I18nService<I18nTranslations>>();
    discountService = mock<DiscountService>();
    notificationsService = mock<NotificationsService>();

    mockTx = {
      product: { findMany: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
      order: { create: jest.fn(), update: jest.fn() },
      discount: { update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: I18nService, useValue: i18n },
        { provide: DiscountService, useValue: discountService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(OrderService);
  });

  // ---------------------------------------------------------------------------
  // createCustomerOrder
  // ---------------------------------------------------------------------------
  describe("createCustomerOrder", () => {
    it("looks up customer by userId and delegates to createOrder", async () => {
      const dto = { items: [{ productId: 1, quantity: 2 }] };
      (prisma.customer.findUniqueOrThrow as jest.Mock)
        .mockResolvedValueOnce({ id: 5 })
        .mockResolvedValueOnce(mockCustomerWithUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([mockProduct]);
      mockTx.order.create.mockResolvedValue(mockOrderWithIncludes);
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("0"));

      const result = await service.createCustomerOrder(10, dto);

      expect(result).toMatchObject({ id: 1 });
      expect(prisma.customer.findUniqueOrThrow).toHaveBeenNthCalledWith(1, {
        where: { userId: 10 },
        select: { id: true },
      });
    });

    it("propagates rejection when user has no customer record", async () => {
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockRejectedValue(new Error("Customer not found"));

      await expect(service.createCustomerOrder(999, { items: [{ productId: 1, quantity: 1 }] })).rejects.toThrow(
        "Customer not found",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // createOrder
  // ---------------------------------------------------------------------------
  describe("createOrder", () => {
    it("creates order with discount applied", async () => {
      const dto = { items: [{ productId: 1, quantity: 2 }], discountId: 1 };
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockCustomerWithUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([mockProduct]);
      mockTx.order.create.mockResolvedValue({
        ...mockOrderWithIncludes,
        appliedDiscountId: 1,
        discountAmount: new Prisma.Decimal("20"),
        total: new Prisma.Decimal("180"),
      });
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("20"));
      discountService.validateDiscountUsable.mockResolvedValue(undefined);

      const result = await service.createOrder(5, dto);

      expect(result).toMatchObject({ id: 1 });
      expect(result.discountAmount).toStrictEqual(new Prisma.Decimal("20"));
      expect(result.total).toStrictEqual(new Prisma.Decimal("180"));
      expect(discountService.validateDiscountUsable).toHaveBeenCalledWith(1);
      expect(mockTx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appliedDiscountId: 1,
            discountAmount: new Prisma.Decimal("20"),
            total: new Prisma.Decimal("180"),
          }) as object,
        }),
      );
    });

    it("creates order without discount when discountId is not provided", async () => {
      const dto = { items: [{ productId: 1, quantity: 2 }] };
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockCustomerWithUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([mockProduct]);
      mockTx.order.create.mockResolvedValue({
        ...mockOrderWithIncludes,
        discountAmount: new Prisma.Decimal("0"),
        total: new Prisma.Decimal("200"),
      });
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("0"));

      const result = await service.createOrder(5, dto);

      expect(result).toMatchObject({ id: 1 });
      expect(result.discountAmount).toStrictEqual(new Prisma.Decimal("0"));
      expect(result.total).toStrictEqual(new Prisma.Decimal("200"));
      expect(discountService.validateDiscountUsable).not.toHaveBeenCalled();
      expect(mockTx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appliedDiscountId: undefined,
            discountAmount: new Prisma.Decimal("0"),
            total: new Prisma.Decimal("200"),
          }) as object,
        }),
      );
    });

    it("throws BadRequestException when stock is insufficient", async () => {
      const dto = { items: [{ productId: 1, quantity: 20 }] };
      const lowStockProduct = { ...mockProduct, quantityInStock: 5 };
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockCustomerWithUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([lowStockProduct]);
      i18n.t.mockReturnValue("Insufficient stock for Product A (stock: 5)");

      await expect(service.createOrder(5, dto)).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when products are not found", async () => {
      const dto = {
        items: [
          { productId: 1, quantity: 2 },
          { productId: 999, quantity: 1 },
        ],
      };
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockCustomerWithUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([mockProduct]);
      i18n.t.mockReturnValue("Some products were not found");

      await expect(service.createOrder(5, dto)).rejects.toThrow(BadRequestException);
    });

    it("propagates rejection when $transaction fails", async () => {
      const dto = { items: [{ productId: 1, quantity: 2 }] };
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockCustomerWithUser);
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error("Transaction failed"));

      await expect(service.createOrder(5, dto)).rejects.toThrow("Transaction failed");
    });
  });

  // ---------------------------------------------------------------------------
  // calculateForUser / calculatePreview
  // ---------------------------------------------------------------------------
  describe("calculateForUser", () => {
    it("looks up customer by userId and delegates to calculatePreview", async () => {
      const dto = { items: [{ productId: 1, quantity: 2 }], discountId: 1 };
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 5 });
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([mockProduct]);
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("20"));

      const result = await service.calculateForUser(10, dto);

      expect(result).toStrictEqual({
        subtotal: new Prisma.Decimal("200"),
        discountAmount: new Prisma.Decimal("20"),
        total: new Prisma.Decimal("180"),
        items: [
          { productId: 1, quantity: 2, unitPrice: new Prisma.Decimal("100"), subtotal: new Prisma.Decimal("200") },
        ],
      });
      expect(prisma.customer.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { userId: 10 },
        select: { id: true },
      });
    });
  });

  describe("calculatePreview", () => {
    it("computes subtotal, discount and total without validating stock", async () => {
      const dto = { items: [{ productId: 1, quantity: 2 }], discountId: 1 };
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([mockProduct]);
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("30"));

      const result = await service.calculatePreview(5, dto);

      expect(result).toStrictEqual({
        subtotal: new Prisma.Decimal("200"),
        discountAmount: new Prisma.Decimal("30"),
        total: new Prisma.Decimal("170"),
        items: [
          { productId: 1, quantity: 2, unitPrice: new Prisma.Decimal("100"), subtotal: new Prisma.Decimal("200") },
        ],
      });
    });

    it("returns zero discount when discountId is not provided", async () => {
      const dto = { items: [{ productId: 1, quantity: 2 }] };
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([mockProduct]);
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("0"));

      const result = await service.calculatePreview(5, dto);

      expect(result).toMatchObject({
        discountAmount: new Prisma.Decimal("0"),
        total: new Prisma.Decimal("200"),
      });
    });

    it("propagates discount validation errors", async () => {
      const dto = { items: [{ productId: 1, quantity: 2 }], discountId: 999 };
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findMany.mockResolvedValue([mockProduct]);
      discountService.calculateOrderDiscount.mockRejectedValue(new BadRequestException("expired"));

      await expect(service.calculatePreview(5, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    it("filters by own customerId when role is CUSTOMER", async () => {
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 5 });
      (prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrderWithIncludes]);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll(10, UserRole.CUSTOMER, defaultQuery);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 5 }) as object,
        }),
      );
    });

    it("uses query.customerId filter for staff roles", async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrderWithIncludes]);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      await service.findAll(1, UserRole.STORE_MANAGER, {
        ...defaultQuery,
        customerId: 5,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 5 }) as object,
        }),
      );
    });

    it("filters by status when provided", async () => {
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);

      await service.findAll(1, UserRole.STORE_MANAGER, {
        ...defaultQuery,
        status: OrderStatus.DELIVERED,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: OrderStatus.DELIVERED }) as object,
        }),
      );
    });

    it("filters by date range when from/to provided", async () => {
      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);

      await service.findAll(1, UserRole.STORE_MANAGER, {
        ...defaultQuery,
        from,
        to,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: from, lte: to },
          }) as object,
        }),
      );
    });

    it("returns paginated response with isFinalPage", async () => {
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 5 });
      (prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrderWithIncludes]);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll(10, UserRole.CUSTOMER, defaultQuery);

      expect(result).toStrictEqual({
        data: [mockOrderWithIncludes],
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("returns order for staff regardless of ownership", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrderWithIncludes);

      const result = await service.findOne(1, 99, UserRole.STORE_MANAGER);

      expect(result).toStrictEqual(mockOrderWithIncludes);
    });

    it("returns order when customer owns it", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrderWithIncludes);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 5 });

      const result = await service.findOne(1, 10, UserRole.CUSTOMER);

      expect(result).toStrictEqual(mockOrderWithIncludes);
    });

    it("throws ForbiddenException when customer tries to access another's order", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrderWithIncludes);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 99 });
      i18n.t.mockReturnValue("No access to this order");

      await expect(service.findOne(1, 10, UserRole.CUSTOMER)).rejects.toThrow(ForbiddenException);
    });

    it("propagates rejection when order is not found (P2025)", async () => {
      const err = new Error("Record not found");
      Object.assign(err, { code: "P2025" });
      (prisma.order.findUniqueOrThrow as jest.Mock).mockRejectedValue(err);

      await expect(service.findOne(999, 1, UserRole.STORE_MANAGER)).rejects.toThrow("Record not found");
    });
  });

  // ---------------------------------------------------------------------------
  // cancelOwn
  // ---------------------------------------------------------------------------
  describe("cancelOwn", () => {
    it("cancels own order when status is cancelable", async () => {
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 5 });
      (prisma.order.findUniqueOrThrow as jest.Mock)
        .mockResolvedValueOnce({ customerId: 5, status: OrderStatus.PENDING })
        .mockResolvedValueOnce(mockOrderForUpdate);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.order.update.mockResolvedValue({
        ...mockOrderWithIncludes,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancelOwn(10, 1);

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it("throws ForbiddenException when order belongs to another customer", async () => {
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 5 });
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        customerId: 99,
        status: OrderStatus.PENDING,
      });
      i18n.t.mockReturnValue("Cannot cancel another customer's order");

      await expect(service.cancelOwn(10, 1)).rejects.toThrow(ForbiddenException);
    });

    it("throws BadRequestException when order status cannot be cancelled", async () => {
      (prisma.customer.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 5 });
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        customerId: 5,
        status: OrderStatus.DELIVERED,
      });
      i18n.t.mockReturnValue("Order cannot be cancelled in its current status");

      await expect(service.cancelOwn(10, 1)).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // updateStatus
  // ---------------------------------------------------------------------------
  describe("updateStatus", () => {
    it("transitions PENDING→PREPARING and reserves stock", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrderForUpdate);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.findUniqueOrThrow.mockResolvedValue(mockProduct);
      mockTx.product.update.mockResolvedValue(undefined);
      mockTx.order.update.mockResolvedValue({
        ...mockOrderWithIncludes,
        status: OrderStatus.PREPARING,
      });

      const result = await service.updateStatus(1, { status: OrderStatus.PREPARING });

      expect(result.status).toBe(OrderStatus.PREPARING);
      expect(mockTx.product.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockTx.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { quantityInStock: { decrement: 2 } },
        }),
      );
    });

    it("transitions PREPARING→OUT_FOR_DELIVERY without stock adjustment", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPreparingOrderForUpdate);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.order.update.mockResolvedValue({
        ...mockOrderWithIncludes,
        status: OrderStatus.OUT_FOR_DELIVERY,
      });

      const result = await service.updateStatus(1, { status: OrderStatus.OUT_FOR_DELIVERY });

      expect(result.status).toBe(OrderStatus.OUT_FOR_DELIVERY);
      expect(mockTx.product.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(mockTx.product.update).not.toHaveBeenCalled();
    });

    it("transitions OUT_FOR_DELIVERY→DELIVERED and increments discount usage", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOutForDeliveryOrderForUpdate);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.order.update.mockResolvedValue({
        ...mockOrderWithIncludes,
        status: OrderStatus.DELIVERED,
      });
      discountService.calculateOrderDiscount.mockResolvedValue(new Prisma.Decimal("20"));
      const result = await service.updateStatus(1, { status: OrderStatus.DELIVERED });

      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(discountService.incrementUsage).toHaveBeenCalledWith(1, mockTx);
    });

    it("transitions PREPARING→CANCELLED and releases stock", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPreparingOrderForUpdate);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      mockTx.product.update.mockResolvedValue(undefined);
      mockTx.order.update.mockResolvedValue({
        ...mockOrderWithIncludes,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.updateStatus(1, { status: OrderStatus.CANCELLED });

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockTx.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { quantityInStock: { increment: 2 } },
        }),
      );
    });

    it("throws BadRequestException for invalid status transition", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrderForUpdate);
      i18n.t.mockReturnValue("Invalid status transition");

      await expect(service.updateStatus(1, { status: OrderStatus.DELIVERED })).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when order is in terminal status", async () => {
      const terminalOrder = { ...mockOrderForUpdate, status: OrderStatus.DELIVERED };
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(terminalOrder);
      i18n.t.mockReturnValue("Cannot update status of DELIVERED order");

      await expect(service.updateStatus(1, { status: OrderStatus.CANCELLED })).rejects.toThrow(BadRequestException);
    });

    it("returns existing order when status is unchanged", async () => {
      const existingOrder = {
        ...mockOrderWithIncludes,
        status: OrderStatus.PENDING,
      };
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValueOnce(mockOrderForUpdate);
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValueOnce(existingOrder);

      const result = await service.updateStatus(1, { status: OrderStatus.PENDING });

      expect(result).toStrictEqual(existingOrder);
    });

    it("throws BadRequestException when insufficient stock for PENDING→PREPARING", async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrderForUpdate);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
      const lowStock = { ...mockProduct, quantityInStock: 1 };
      mockTx.product.findUniqueOrThrow.mockResolvedValue(lowStock);
      i18n.t.mockReturnValue("Insufficient stock for Product A (stock: 1)");

      await expect(service.updateStatus(1, { status: OrderStatus.PREPARING })).rejects.toThrow(BadRequestException);
    });
  });
});

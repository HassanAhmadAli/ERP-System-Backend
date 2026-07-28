import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { mockDeep, DeepMockProxy, mock } from "jest-mock-extended";
import { Prisma, InvoiceStatus } from "@/prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { PurchaseService } from "./purchase.service";
import { CreatePurchaseInvoiceDto } from "./dto/create-purchase-invoice.dto";

describe("PurchaseService", () => {
  let service: PurchaseService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;
  let i18n: jest.Mocked<I18nService<I18nTranslations>>;

  const mockEmployee = { id: 10, userId: 1 };
  const mockSupplier = { id: 5, fullName: "Supplier Co", fullNameAr: null, email: "sup@test.com", phone: "+123" };
  const mockProduct = {
    id: 1,
    name: "Item",
    nameAr: null,
    barcode: "123",
    supplierId: 5,
    quantityInStock: 0,
    purchasePrice: new Prisma.Decimal("0"),
    minQuantity: 5,
    sellingPrice: new Prisma.Decimal("100"),
  };
  const mockInvoice = {
    id: 1,
    supplierId: 5,
    accountantId: 10,
    total: new Prisma.Decimal("200"),
    status: "PENDING" as InvoiceStatus,
    invoiceDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { id: 1, productId: 1, quantity: 2, unitCost: new Prisma.Decimal("100"), subtotal: new Prisma.Decimal("200") },
    ],
    supplier: mockSupplier,
    accountant: { id: 10, user: { id: 1, fullName: "John", fullNameAr: null, email: "john@test.com" } },
  };
  const mockTransactionClient = {
    product: { findMany: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
    purchaseInvoice: { create: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();
    i18n = mock<I18nService<I18nTranslations>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(PurchaseService);
  });

  describe("create", () => {
    it("creates a PENDING invoice", async () => {
      const dto = {
        supplierId: 5,
        receive: false,
        items: [{ productId: 1, quantity: 2, unitCost: new Prisma.Decimal("100") }],
        invoiceDate: new Date(),
      };
      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      (prisma.supplier.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockSupplier);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient));
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      mockTransactionClient.purchaseInvoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create(1, dto);

      expect(result).toStrictEqual(mockInvoice);
      expect(mockTransactionClient.purchaseInvoice.create).toHaveBeenCalled();
    });

    it("creates a COMPLETED invoice and applies receive effects when receive=true", async () => {
      const dto: CreatePurchaseInvoiceDto = {
        supplierId: 5,
        receive: true,
        items: [{ productId: 1, quantity: 2, unitCost: new Prisma.Decimal("100") }],
        invoiceDate: new Date(),
      };
      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      (prisma.supplier.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockSupplier);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient));
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      mockTransactionClient.purchaseInvoice.create.mockResolvedValue({ ...mockInvoice, status: "COMPLETED" });
      mockTransactionClient.product.update.mockResolvedValue({ ...mockProduct, quantityInStock: 2 });

      const result = await service.create(1, dto);

      expect(result.status).toBe("COMPLETED");
      expect(mockTransactionClient.product.update).toHaveBeenCalled();
    });

    it("throws BadRequest when product does not belong to supplier", async () => {
      const dto = {
        supplierId: 5,
        receive: false,
        items: [{ productId: 1, quantity: 2, unitCost: new Prisma.Decimal("100") }],
        invoiceDate: new Date(),
      };
      const wrongSupplierProduct = { ...mockProduct, supplierId: 99 };
      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      (prisma.supplier.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockSupplier);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient));
      mockTransactionClient.product.findMany.mockResolvedValue([wrongSupplierProduct]);
      i18n.t.mockReturnValue("Product does not belong to this supplier");

      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequest when products are not found", async () => {
      const dto = {
        supplierId: 5,
        receive: false,
        items: [
          { productId: 1, quantity: 2, unitCost: new Prisma.Decimal("100") },
          { productId: 2, quantity: 1, unitCost: new Prisma.Decimal("50") },
        ],
        invoiceDate: new Date(),
      };
      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      (prisma.supplier.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockSupplier);
      prisma.$transaction.mockImplementation(async (cb) => cb(mockTransactionClient));
      mockTransactionClient.product.findMany.mockResolvedValue([mockProduct]);
      i18n.t.mockReturnValue("Some products were not found");

      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
    });

    it("propagates rejection when employee not found", async () => {
      prisma.employee.findUniqueOrThrow.mockRejectedValue(new Error("Employee not found"));

      await expect(
        service.create(999, { supplierId: 1, receive: false, items: [], invoiceDate: new Date() }),
      ).rejects.toThrow("Employee not found");
    });

    it("propagates rejection when supplier not found", async () => {
      prisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee as never);
      (prisma.supplier.findUniqueOrThrow as jest.Mock).mockRejectedValue(new Error("Supplier not found"));

      await expect(
        service.create(1, { supplierId: 999, receive: false, items: [], invoiceDate: new Date() }),
      ).rejects.toThrow("Supplier not found");
    });
  });

  describe("findAll", () => {
    it("returns paginated invoices", async () => {
      prisma.purchaseInvoice.findMany.mockResolvedValue([mockInvoice] as never);
      prisma.purchaseInvoice.count.mockResolvedValue(1);
      const query = { limit: 10, offset: 0, deleted: false };

      const result = await service.findAll(query);

      expect(result).toMatchObject({ data: [mockInvoice], total: 1, limit: 10, offset: 0 });
    });

    it("filters by status", async () => {
      prisma.purchaseInvoice.findMany.mockResolvedValue([] as never);
      prisma.purchaseInvoice.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, status: "COMPLETED", deleted: false });

      expect(prisma.purchaseInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: "COMPLETED" }) as object }) as object,
      );
    });

    it("filters by supplierId", async () => {
      prisma.purchaseInvoice.findMany.mockResolvedValue([] as never);
      prisma.purchaseInvoice.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, supplierId: 5, deleted: false });

      expect(prisma.purchaseInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ supplierId: 5 }) as object }) as object,
      );
    });
  });

  describe("findOne", () => {
    it("returns invoice when found", async () => {
      prisma.purchaseInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoice as never);

      const result = await service.findOne(1);

      expect(result).toStrictEqual(mockInvoice);
    });

    it("propagates rejection when not found", async () => {
      prisma.purchaseInvoice.findUniqueOrThrow.mockRejectedValue(new Error("Not found"));

      await expect(service.findOne(999)).rejects.toThrow("Not found");
    });
  });

  describe("updateStatus", () => {
    it("completes a PENDING invoice", async () => {
      const invoice = {
        ...mockInvoice,
        status: "PENDING" as InvoiceStatus,
        items: [
          { productId: 1, quantity: 2, unitCost: new Prisma.Decimal("100"), subtotal: new Prisma.Decimal("200") },
        ],
      };
      prisma.purchaseInvoice.findUniqueOrThrow.mockResolvedValue(invoice as never);
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          product: { update: jest.fn().mockResolvedValue(undefined) },
          purchaseInvoice: { update: jest.fn().mockResolvedValue({ ...invoice, status: "COMPLETED" }) },
        };
        return cb(tx);
      });

      const result = await service.updateStatus(1, { status: "COMPLETED" });

      expect(result.status).toBe("COMPLETED");
    });

    it("refunds a COMPLETED invoice", async () => {
      const invoice = {
        ...mockInvoice,
        status: "COMPLETED" as InvoiceStatus,
        items: [
          {
            productId: 1,
            quantity: 2,
            unitCost: new Prisma.Decimal("100"),
            subtotal: new Prisma.Decimal("200"),
            expiryDate: null,
          },
        ],
      };
      prisma.purchaseInvoice.findUniqueOrThrow.mockResolvedValue(invoice as never);
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          product: {
            findUniqueOrThrow: jest.fn().mockResolvedValue({ quantityInStock: 10 }),
            update: jest.fn().mockResolvedValue(undefined),
          },
          purchaseInvoice: { update: jest.fn().mockResolvedValue({ ...invoice, status: "REFUNDED" }) },
        };
        return cb(tx);
      });

      const result = await service.updateStatus(1, { status: "REFUNDED" });

      expect(result.status).toBe("REFUNDED");
    });

    it("throws BadRequest when refunding with insufficient stock", async () => {
      const invoice = {
        ...mockInvoice,
        status: "COMPLETED" as InvoiceStatus,
        items: [
          {
            productId: 1,
            quantity: 2,
            unitCost: new Prisma.Decimal("100"),
            subtotal: new Prisma.Decimal("200"),
            expiryDate: null,
          },
        ],
      };
      prisma.purchaseInvoice.findUniqueOrThrow.mockResolvedValue(invoice as never);
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          product: { findUniqueOrThrow: jest.fn().mockResolvedValue({ quantityInStock: 1 }), update: jest.fn() },
          purchaseInvoice: { update: jest.fn() },
        };
        i18n.t.mockReturnValue("Insufficient stock to refund");
        return cb(tx);
      });

      await expect(service.updateStatus(1, { status: "REFUNDED" })).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequest for terminal status", async () => {
      prisma.purchaseInvoice.findUniqueOrThrow.mockResolvedValue({ ...mockInvoice, status: "CANCELLED" } as never);
      i18n.t.mockReturnValue("Cannot update status");

      await expect(service.updateStatus(1, { status: "COMPLETED" })).rejects.toThrow(BadRequestException);
    });

    it("returns existing invoice when status is same", async () => {
      prisma.purchaseInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoice as never);
      prisma.purchaseInvoice.findUniqueOrThrow.mockResolvedValue(mockInvoice as never);

      const result = await service.updateStatus(1, { status: "PENDING" });

      expect(result).toStrictEqual(mockInvoice);
    });

    it("throws BadRequest for invalid transition", async () => {
      prisma.purchaseInvoice.findUniqueOrThrow.mockResolvedValue({ ...mockInvoice, status: "PENDING" } as never);
      i18n.t.mockReturnValue("Invalid status transition");

      await expect(service.updateStatus(1, { status: "REFUNDED" })).rejects.toThrow(BadRequestException);
    });
  });
});

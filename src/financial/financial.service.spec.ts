import { Test, TestingModule } from "@nestjs/testing";
import { Prisma } from "@/prisma/client";
import { FinancialService } from "./financial.service";
import { PrismaService } from "@/prisma/prisma.service";

describe("FinancialService", () => {
  let service: FinancialService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockProduct = {
    id: 1,
    name: "Mouse",
    nameAr: null,
    barcode: "123",
    purchasePrice: new Prisma.Decimal("50"),
    sellingPrice: new Prisma.Decimal("100"),
    quantityInStock: 10,
    category: { id: 1, name: "Electronics", nameAr: null },
  };

  const aggregate = (overrides: { total?: string; amount?: string; discountAmount?: string; subtotal?: string } = {}) =>
    ({
      _sum: {
        total: overrides.total != undefined ? new Prisma.Decimal(overrides.total) : null,
        amount: overrides.amount != undefined ? new Prisma.Decimal(overrides.amount) : null,
        discountAmount: overrides.discountAmount != undefined ? new Prisma.Decimal(overrides.discountAmount) : null,
        subtotal: overrides.subtotal != undefined ? new Prisma.Decimal(overrides.subtotal) : null,
      },
    }) as never;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              product: {
                findMany: jest.fn(),
                count: jest.fn(),
                update: jest.fn(),
              },
              purchaseInvoice: {
                aggregate: jest.fn(),
                findMany: jest.fn(),
              },
              expense: {
                aggregate: jest.fn(),
              },
              salesInvoice: {
                aggregate: jest.fn(),
              },
              purchaseItem: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
              },
              supplier: {
                findUniqueOrThrow: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get(FinancialService);
    prismaService = module.get(PrismaService);
  });

  describe("getProfitMargins", () => {
    it("computes margin and margin percent for each product", async () => {
      jest.mocked(prismaService.client.product.findMany).mockResolvedValue([mockProduct] as never);
      jest.mocked(prismaService.client.product.count).mockResolvedValue(1);

      const result = await service.getProfitMargins({ limit: 10, offset: 5 });

      expect(result).toStrictEqual({
        data: [
          {
            productId: 1,
            name: "Mouse",
            nameAr: null,
            barcode: "123",
            category: "Electronics",
            categoryAr: null,
            purchasePrice: "50.00",
            sellingPrice: "100.00",
            margin: "50.00",
            marginPercent: "50.00",
            quantityInStock: 10,
          },
        ],
        total: 1,
        limit: 10,
        offset: 5,
        isFinalPage: true,
      });
      expect(prismaService.client.product.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({ id: true, name: true }),
        skip: 5,
        take: 10,
        orderBy: { name: "asc" },
      });
    });

    it("returns 0 margin percent when selling price is zero", async () => {
      jest
        .mocked(prismaService.client.product.findMany)
        .mockResolvedValue([{ ...mockProduct, sellingPrice: new Prisma.Decimal("0") }] as never);
      jest.mocked(prismaService.client.product.count).mockResolvedValue(1);

      const result = await service.getProfitMargins();

      expect(result.data[0]?.marginPercent).toBe("0.00");
    });

    it("returns null pagination when no query is provided", async () => {
      jest.mocked(prismaService.client.product.findMany).mockResolvedValue([mockProduct] as never);
      jest.mocked(prismaService.client.product.count).mockResolvedValue(1);

      const result = await service.getProfitMargins();

      expect(result.limit).toBeNull();
      expect(result.offset).toBeNull();
      expect(result.isFinalPage).toBeUndefined();
      expect(prismaService.client.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: undefined, take: undefined }),
      );
    });
  });

  describe("getCostBreakdown", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");

    it("computes revenue, costs and profit figures", async () => {
      jest.mocked(prismaService.client.purchaseInvoice.aggregate).mockResolvedValue(aggregate({ total: "4000" }));
      jest.mocked(prismaService.client.expense.aggregate).mockResolvedValue(aggregate({ amount: "1000" }));
      jest
        .mocked(prismaService.client.salesInvoice.aggregate)
        .mockResolvedValue(aggregate({ total: "10000", discountAmount: "200", subtotal: "10200" }));

      const result = await service.getCostBreakdown({ from, to });

      expect(result).toStrictEqual({
        period: { from: from.toISOString(), to: to.toISOString() },
        revenue: "10000.00",
        purchasingCosts: "4000.00",
        operatingExpenses: "1000.00",
        discountsGiven: "200.00",
        grossProfit: "6000.00",
        netProfit: "5000.00",
      });
    });

    it("restricts aggregates to COMPLETED invoices and applies the date range", async () => {
      jest.mocked(prismaService.client.purchaseInvoice.aggregate).mockResolvedValue(aggregate());
      jest.mocked(prismaService.client.expense.aggregate).mockResolvedValue(aggregate());
      jest.mocked(prismaService.client.salesInvoice.aggregate).mockResolvedValue(aggregate());

      await service.getCostBreakdown({ from, to });

      expect(prismaService.client.purchaseInvoice.aggregate).toHaveBeenCalledWith({
        where: { status: "COMPLETED", createdAt: { gte: from, lte: to } },
        _sum: { total: true },
      });
      expect(prismaService.client.salesInvoice.aggregate).toHaveBeenCalledWith({
        where: { status: "COMPLETED", createdAt: { gte: from, lte: to } },
        _sum: { total: true, discountAmount: true, subtotal: true },
      });
      expect(prismaService.client.expense.aggregate).toHaveBeenCalledWith({
        where: { expenseDate: { gte: from, lte: to } },
        _sum: { amount: true },
      });
    });

    it("defaults to zero when aggregates are null", async () => {
      jest.mocked(prismaService.client.purchaseInvoice.aggregate).mockResolvedValue({
        _sum: { total: null },
      } as never);
      jest.mocked(prismaService.client.expense.aggregate).mockResolvedValue({ _sum: { amount: null } } as never);
      jest.mocked(prismaService.client.salesInvoice.aggregate).mockResolvedValue({
        _sum: { total: null, discountAmount: null, subtotal: null },
      } as never);

      const result = await service.getCostBreakdown({});

      expect(result.revenue).toBe("0.00");
      expect(result.purchasingCosts).toBe("0.00");
      expect(result.operatingExpenses).toBe("0.00");
      expect(result.grossProfit).toBe("0.00");
      expect(result.netProfit).toBe("0.00");
      expect(result.period).toStrictEqual({ from: null, to: null });
    });
  });

  describe("getCostTrends", () => {
    const item = (createdAt: Date, subtotal: string, quantity: number) => ({
      id: 1,
      productId: 1,
      quantity,
      subtotal: new Prisma.Decimal(subtotal),
      product: { id: 1, name: "Mouse", nameAr: null },
      purchase: { createdAt },
    });

    it("buckets by day", async () => {
      const createdAt = new Date("2026-01-05T10:00:00Z");
      jest
        .mocked(prismaService.client.purchaseItem.findMany)
        .mockResolvedValue([item(createdAt, "100", 2), item(createdAt, "50", 1)] as never);

      const result = await service.getCostTrends({ productId: 1, from: new Date(), to: new Date(), groupBy: "day" });

      expect(result).toStrictEqual([
        { period: "2026-01-05", totalCost: "150.00", quantity: 3, averageUnitCost: "50.00" },
      ]);
    });

    it("buckets by month", async () => {
      jest
        .mocked(prismaService.client.purchaseItem.findMany)
        .mockResolvedValue([
          item(new Date("2026-01-05T10:00:00Z"), "100", 2),
          item(new Date("2026-02-05T10:00:00Z"), "50", 1),
        ] as never);

      const result = await service.getCostTrends({ productId: 1, from: new Date(), to: new Date(), groupBy: "month" });

      expect(result).toStrictEqual([
        { period: "2026-01", totalCost: "100.00", quantity: 2, averageUnitCost: "50.00" },
        { period: "2026-02", totalCost: "50.00", quantity: 1, averageUnitCost: "50.00" },
      ]);
    });

    it("buckets by week and handles zero quantity", async () => {
      jest
        .mocked(prismaService.client.purchaseItem.findMany)
        .mockResolvedValue([item(new Date("2026-01-05T10:00:00Z"), "120", 0)] as never);

      const result = await service.getCostTrends({ productId: 1, from: new Date(), to: new Date(), groupBy: "week" });

      expect(result).toStrictEqual([
        { period: "2026-01-W1", totalCost: "120.00", quantity: 0, averageUnitCost: "0.00" },
      ]);
    });

    it("passes product and date filters to the query", async () => {
      const from = new Date("2026-01-01");
      const to = new Date("2026-01-31");
      jest.mocked(prismaService.client.purchaseItem.findMany).mockResolvedValue([] as never);

      await service.getCostTrends({ productId: 7, from, to, groupBy: "day" });

      expect(prismaService.client.purchaseItem.findMany).toHaveBeenCalledWith({
        where: { productId: 7, purchase: { status: "COMPLETED", createdAt: { gte: from, lte: to } } },
        include: expect.objectContaining({ product: expect.objectContaining({ select: expect.any(Object) }) }),
        orderBy: { purchase: { createdAt: "asc" } },
      });
    });
  });

  describe("recalculateCosts", () => {
    it("updates purchase price from the latest completed purchase", async () => {
      jest.mocked(prismaService.client.product.findMany).mockResolvedValue([mockProduct] as never);
      jest.mocked(prismaService.client.purchaseItem.findFirst).mockResolvedValue({
        unitCost: new Prisma.Decimal("80"),
      } as never);
      const updatedProduct = { ...mockProduct, purchasePrice: new Prisma.Decimal("80") };
      jest.mocked(prismaService.client.product.update).mockResolvedValue(updatedProduct as never);

      const result = await service.recalculateCosts();

      expect(result).toStrictEqual({
        updated: 1,
        products: [{ productId: 1, name: "Mouse", nameAr: null, oldCost: "50.00", newCost: "80.00" }],
      });
      expect(prismaService.client.purchaseItem.findFirst).toHaveBeenCalledWith({
        where: { productId: 1, purchase: { status: "COMPLETED" } },
        orderBy: { purchase: { createdAt: "desc" } },
        select: { unitCost: true },
      });
    });

    it("skips products without any completed purchase", async () => {
      jest.mocked(prismaService.client.product.findMany).mockResolvedValue([mockProduct] as never);
      jest.mocked(prismaService.client.purchaseItem.findFirst).mockResolvedValue(null);

      const result = await service.recalculateCosts([1]);

      expect(result).toStrictEqual({ updated: 0, products: [] });
      expect(prismaService.client.product.update).not.toHaveBeenCalled();
    });

    it("restricts to the given product ids when provided", async () => {
      jest.mocked(prismaService.client.product.findMany).mockResolvedValue([] as never);

      await service.recalculateCosts([1, 2]);

      expect(prismaService.client.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: [1, 2] } } }),
      );
    });
  });

  describe("getSupplierReport", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    const mockSupplier = {
      id: 5,
      fullName: "Tech Supplies",
      fullNameAr: null,
      email: "supplier@test.com",
      phone: "123456",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("returns supplier summary with invoices and totals", async () => {
      jest.mocked(prismaService.client.supplier.findUniqueOrThrow).mockResolvedValue(mockSupplier as never);
      jest.mocked(prismaService.client.purchaseInvoice.findMany).mockResolvedValue([
        {
          id: 11,
          total: new Prisma.Decimal("250"),
          invoiceDate: new Date("2026-01-10"),
          createdAt: new Date("2026-01-11"),
          items: [
            { id: 1, product: { id: 1, name: "Mouse", nameAr: null } },
            { id: 2, product: { id: 2, name: "Keyboard", nameAr: null } },
          ],
        },
      ] as never);
      jest.mocked(prismaService.client.purchaseInvoice.aggregate).mockResolvedValue({
        _sum: { total: new Prisma.Decimal("250") },
        _count: 1,
      } as never);

      const result = await service.getSupplierReport({ supplierId: 5, from, to });

      expect(result.supplier).toStrictEqual({
        id: 5,
        fullName: "Tech Supplies",
        fullNameAr: null,
        email: "supplier@test.com",
        phone: "123456",
      });
      expect(result.period).toStrictEqual({ from: from.toISOString(), to: to.toISOString() });
      expect(result.invoiceCount).toBe(1);
      expect(result.totalSpent).toBe("250.00");
      expect(result.invoices).toStrictEqual([
        {
          id: 11,
          total: "250.00",
          invoiceDate: new Date("2026-01-10").toISOString(),
          createdAt: new Date("2026-01-11").toISOString(),
          itemCount: 2,
        },
      ]);
    });

    it("filters invoices by supplier and date range", async () => {
      jest.mocked(prismaService.client.supplier.findUniqueOrThrow).mockResolvedValue(mockSupplier as never);
      jest.mocked(prismaService.client.purchaseInvoice.findMany).mockResolvedValue([] as never);
      jest.mocked(prismaService.client.purchaseInvoice.aggregate).mockResolvedValue({
        _sum: { total: new Prisma.Decimal("0") },
        _count: 0,
      } as never);

      await service.getSupplierReport({ supplierId: 5, from, to });

      expect(prismaService.client.purchaseInvoice.findMany).toHaveBeenCalledWith({
        where: { supplierId: 5, status: "COMPLETED", createdAt: { gte: from, lte: to } },
        include: { items: { include: { product: { select: { id: true, name: true, nameAr: true } } } } },
        orderBy: { createdAt: "desc" },
      });
      expect(prismaService.client.purchaseInvoice.aggregate).toHaveBeenCalledWith({
        where: { supplierId: 5, status: "COMPLETED", createdAt: { gte: from, lte: to } },
        _sum: { total: true },
        _count: true,
      });
    });

    it("propagates Prisma not-found error for missing supplier", async () => {
      const error = new Error("Supplier not found");
      jest.mocked(prismaService.client.supplier.findUniqueOrThrow).mockRejectedValue(error);

      await expect(service.getSupplierReport({ supplierId: 999 })).rejects.toThrow(error);
    });
  });
});

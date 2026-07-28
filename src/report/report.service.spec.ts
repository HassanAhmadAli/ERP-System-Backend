import { Test, TestingModule } from "@nestjs/testing";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { Prisma } from "@/prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { ReportService } from "./report.service";

describe("ReportService", () => {
  let service: ReportService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportService, { provide: PrismaService, useValue: { client: prisma } }],
    }).compile();

    service = module.get(ReportService);
  });

  describe("getSummary", () => {
    it("returns summary with revenue, purchases, expenses, and computed profits", async () => {
      prisma.salesInvoice.aggregate.mockResolvedValue({ _sum: { total: new Prisma.Decimal("10000") } } as never);
      prisma.purchaseInvoice.aggregate.mockResolvedValue({ _sum: { total: new Prisma.Decimal("4000") } } as never);
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal("1000") } } as never);
      prisma.salesInvoice.count.mockResolvedValue(5);
      prisma.order.count.mockResolvedValue(3);
      prisma.product.count.mockResolvedValue(2);
      prisma.saleItem.groupBy
        .mockResolvedValueOnce([
          { productId: 1, _sum: { subtotal: new Prisma.Decimal("3000"), quantity: 10 } },
        ] as never)
        .mockResolvedValueOnce([{ productId: 1, _sum: { subtotal: new Prisma.Decimal("3000") } }] as never);
      prisma.product.findMany
        .mockResolvedValueOnce([{ id: 1, name: "Widget", nameAr: null }] as never)
        .mockResolvedValueOnce([{ id: 1, categoryId: 2, category: { id: 2, name: "Tools", nameAr: null } }] as never);

      const result = await service.getSummary({});

      expect(result.revenue).toBe("10000.00");
      expect(result.purchases).toBe("4000.00");
      expect(result.expenses).toBe("1000.00");
      expect(result.grossProfit).toBe("6000.00");
      expect(result.netProfit).toBe("5000.00");
      expect(result.salesCount).toBe(5);
      expect(result.ordersDelivered).toBe(3);
      expect(result.lowStockProducts).toBe(2);
      expect(result.topProducts).toHaveLength(1);
      expect(result.salesByCategory).toHaveLength(1);
    });

    it("handles zero aggregates gracefully", async () => {
      prisma.salesInvoice.aggregate.mockResolvedValue({ _sum: { total: null } } as never);
      prisma.purchaseInvoice.aggregate.mockResolvedValue({ _sum: { total: null } } as never);
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } } as never);
      prisma.salesInvoice.count.mockResolvedValue(0);
      prisma.order.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.saleItem.groupBy.mockResolvedValue([] as never);
      prisma.product.findMany.mockResolvedValue([] as never);

      const result = await service.getSummary({});

      expect(result.revenue).toBe("0.00");
      expect(result.purchases).toBe("0.00");
      expect(result.expenses).toBe("0.00");
      expect(result.grossProfit).toBe("0.00");
      expect(result.netProfit).toBe("0.00");
      expect(result.salesCount).toBe(0);
      expect(result.ordersDelivered).toBe(0);
      expect(result.lowStockProducts).toBe(0);
      expect(result.topProducts).toStrictEqual([]);
      expect(result.salesByCategory).toStrictEqual([]);
    });

    it("applies date range filters when query has from/to", async () => {
      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");
      prisma.salesInvoice.aggregate.mockResolvedValue({ _sum: { total: null } } as never);
      prisma.purchaseInvoice.aggregate.mockResolvedValue({ _sum: { total: null } } as never);
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } } as never);
      prisma.salesInvoice.count.mockResolvedValue(0);
      prisma.order.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.saleItem.groupBy.mockResolvedValue([] as never);
      prisma.product.findMany.mockResolvedValue([] as never);

      await service.getSummary({ from, to });

      expect(prisma.salesInvoice.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "COMPLETED",
            createdAt: { gte: from, lte: to },
          }) as object,
        }),
      );
    });

    it("handles deleted product in top products gracefully", async () => {
      prisma.salesInvoice.aggregate.mockResolvedValue({ _sum: { total: null } } as never);
      prisma.purchaseInvoice.aggregate.mockResolvedValue({ _sum: { total: null } } as never);
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } } as never);
      prisma.salesInvoice.count.mockResolvedValue(0);
      prisma.order.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.saleItem.groupBy
        .mockResolvedValueOnce([{ productId: 99, _sum: { subtotal: new Prisma.Decimal("500"), quantity: 2 } }] as never)
        .mockResolvedValueOnce([] as never);
      prisma.product.findMany.mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never);

      const result = await service.getSummary({});

      expect(result.topProducts[0]!.name).toBe("Deleted Product (ID: 99)");
    });
  });

  describe("getDashboard", () => {
    it("returns today's sales, pending orders, and low stock count", async () => {
      prisma.salesInvoice.aggregate.mockResolvedValue({ _sum: { total: new Prisma.Decimal("2500") } } as never);
      prisma.salesInvoice.count.mockResolvedValue(8);
      prisma.order.count.mockResolvedValue(4);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.getDashboard();

      expect(result).toMatchObject({
        lowStockProducts: 1,
        salesToday: { count: 8, revenue: "2500.00" },
        pendingOrders: 4,
      });
      expect(result.date).toBeDefined();
    });

    it("handles zero sales today", async () => {
      prisma.salesInvoice.aggregate.mockResolvedValue({ _sum: { total: null } } as never);
      prisma.salesInvoice.count.mockResolvedValue(0);
      prisma.order.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);

      const result = await service.getDashboard();

      expect(result.salesToday.revenue).toBe("0.00");
      expect(result.salesToday.count).toBe(0);
    });
  });

  describe("getInventoryReport", () => {
    const mockProducts = [
      {
        id: 1,
        name: "Product A",
        nameAr: null,
        barcode: "123",
        quantityInStock: 10,
        minQuantity: 5,
        purchasePrice: new Prisma.Decimal("50"),
        sellingPrice: new Prisma.Decimal("100"),
        category: { id: 1, name: "Cat1", nameAr: null },
        supplier: { id: 1, fullName: "Sup1", fullNameAr: null },
      },
      {
        id: 2,
        name: "Product B",
        nameAr: null,
        barcode: "456",
        quantityInStock: 3,
        minQuantity: 5,
        purchasePrice: new Prisma.Decimal("20"),
        sellingPrice: new Prisma.Decimal("40"),
        category: { id: 2, name: "Cat2", nameAr: null },
        supplier: { id: 2, fullName: "Sup2", fullNameAr: null },
      },
      {
        id: 3,
        name: "Product C",
        nameAr: null,
        barcode: "789",
        quantityInStock: 0,
        minQuantity: 5,
        purchasePrice: new Prisma.Decimal("10"),
        sellingPrice: new Prisma.Decimal("30"),
        category: { id: 1, name: "Cat1", nameAr: null },
        supplier: { id: 1, fullName: "Sup1", fullNameAr: null },
      },
    ];

    it("returns inventory report with stock statuses", async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts as never);
      prisma.product.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const result = await service.getInventoryReport();

      expect(result.totalProducts).toBe(3);
      expect(result.lowStockCount).toBe(1);
      expect(result.outOfStockCount).toBe(1);
      expect(result.stockValue).toBe("560.00");
      expect(result.products).toHaveLength(3);
      expect(result.products[0]!.stockStatus).toBe("ok");
      expect(result.products[1]!.stockStatus).toBe("low");
      expect(result.products[2]!.stockStatus).toBe("out_of_stock");
    });

    it("handles empty products", async () => {
      prisma.product.findMany.mockResolvedValue([] as never);
      prisma.product.count.mockResolvedValue(0);

      const result = await service.getInventoryReport();

      expect(result.totalProducts).toBe(0);
      expect(result.stockValue).toBe("0.00");
      expect(result.products).toStrictEqual([]);
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { mock, mockDeep, DeepMockProxy } from "jest-mock-extended";
import { Prisma } from "@/prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { ReportExportService, ExportReportType } from "./report-export.service";
import { ReportService } from "./report.service";
import { FinancialService } from "@/financial/financial.service";

/* eslint-disable @typescript-eslint/unbound-method */

describe("ReportExportService", () => {
  let service: ReportExportService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;
  let reportService: jest.Mocked<ReportService>;
  let financialService: jest.Mocked<FinancialService>;
  let i18n: jest.Mocked<I18nService<I18nTranslations>>;

  const query = {};

  const summaryFixture = {
    period: { from: "2024-01-01T00:00:00.000Z", to: "2024-12-31T00:00:00.000Z" },
    revenue: "10000.00",
    purchases: "4000.00",
    expenses: "1000.00",
    grossProfit: "6000.00",
    netProfit: "5000.00",
    salesCount: 50,
    ordersDelivered: 30,
    lowStockProducts: 5,
    topProducts: [{ productId: 1, name: "Widget", nameAr: null, quantitySold: 10, revenue: "3000.00" }],
    salesByCategory: [{ categoryId: 1, name: "Tools", nameAr: null, revenue: "3000.00" }],
  };

  const productFixtures = [
    {
      id: 1,
      name: "Widget",
      nameAr: null,
      barcode: "123",
      quantityInStock: 20,
      minQuantity: 5,
      purchasePrice: new Prisma.Decimal("50.00"),
      sellingPrice: new Prisma.Decimal("100.00"),
      category: { name: "Tools", nameAr: null },
      supplier: { fullName: "Supplier A", fullNameAr: null },
    },
    {
      id: 2,
      name: "Gadget",
      nameAr: null,
      barcode: "456",
      quantityInStock: 3,
      minQuantity: 10,
      purchasePrice: new Prisma.Decimal("30.00"),
      sellingPrice: new Prisma.Decimal("60.00"),
      category: { name: "Electronics", nameAr: null },
      supplier: { fullName: "Supplier B", fullNameAr: null },
    },
  ];

  const purchaseFixtures = [
    {
      id: 1,
      total: new Prisma.Decimal("500.00"),
      status: "PAID" as const,
      invoiceDate: new Date("2024-06-15"),
      createdAt: new Date("2024-06-15T10:00:00Z"),
      supplier: { fullName: "Supplier A", fullNameAr: null },
      accountant: { user: { fullName: "Accountant A", fullNameAr: null } },
    },
  ];

  const profitMarginData = {
    data: [
      {
        productId: 1,
        name: "Widget",
        nameAr: null,
        barcode: "123",
        category: "Tools",
        categoryAr: null,
        purchasePrice: "50.00",
        sellingPrice: "100.00",
        margin: "50.00",
        marginPercent: "50.00",
        quantityInStock: 20,
      },
    ],
    total: 1,
    limit: null,
    offset: null,
  };

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();
    reportService = mock<ReportService>();
    financialService = mock<FinancialService>();
    i18n = mock<I18nService<I18nTranslations>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportExportService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: ReportService, useValue: reportService },
        { provide: FinancialService, useValue: financialService },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(ReportExportService);
  });

  describe("export", () => {
    it("returns CSV buffer, text/csv contentType, and a dated filename", async () => {
      i18n.t.mockReturnValue("Metric");
      reportService.getSummary.mockResolvedValue(summaryFixture);

      const result = await service.export("summary", query);

      expect(result.contentType).toBe("text/csv");
      expect(result.filename).toMatch(/^summary-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe("summary report type", () => {
    it("delegates to reportService.getSummary and translates metric labels via i18n", async () => {
      i18n.t.mockReturnValue("Translated Metric");
      reportService.getSummary.mockResolvedValue(summaryFixture);

      await service.export("summary", query);

      expect(reportService.getSummary).toHaveBeenCalledWith(query);
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.revenue");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.purchases");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.expenses");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.grossProfit");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.netProfit");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.salesCount");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.lowStockProducts");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.ordersDelivered");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.salesByCategory");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.topProducts");
      expect(i18n.t).toHaveBeenCalledWith("reports.metrics.period");
    });
  });

  describe("inventory report type", () => {
    it("queries prisma products with category/supplier and returns typed rows", async () => {
      prisma.product.findMany.mockResolvedValue(productFixtures as never);

      const result = await service.export("inventory", query);

      const csvContent = result.buffer.toString();
      expect(csvContent).toContain("Widget");
      expect(csvContent).toContain("Gadget");
      expect(csvContent).toContain("Supplier A");
      expect(csvContent).toContain("yes");
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            category: { select: { name: true, nameAr: true } },
            supplier: { select: { fullName: true, fullNameAr: true } },
          },
          orderBy: { name: "asc" },
        }),
      );
    });
  });

  describe("sales report type", () => {
    it("delegates to reportService.getSummary and maps topProducts", async () => {
      reportService.getSummary.mockResolvedValue(summaryFixture);

      const result = await service.export("sales", query);

      const csvContent = result.buffer.toString();
      expect(csvContent).toContain("Widget");
      expect(csvContent).toContain("3000.00");
      expect(reportService.getSummary).toHaveBeenCalledWith(query);
    });
  });

  describe("purchases report type", () => {
    it("queries prisma purchaseInvoice and returns typed rows", async () => {
      prisma.purchaseInvoice.findMany.mockResolvedValue(purchaseFixtures as never);

      const result = await service.export("purchases", query);

      const csvContent = result.buffer.toString();
      expect(csvContent).toContain("Supplier A");
      expect(csvContent).toContain("Accountant A");
      expect(csvContent).toContain("500.00");
      expect(csvContent).toContain("PAID");
      expect(prisma.purchaseInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "desc" } }) as object,
      );
    });

    it("applies date range filters when from/to are provided", async () => {
      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");
      const datedQuery = { from, to };
      prisma.purchaseInvoice.findMany.mockResolvedValue([] as never);

      await service.export("purchases", datedQuery);

      expect(prisma.purchaseInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: { gte: from, lte: to } },
        }),
      );
    });
  });

  describe("profit-margins report type", () => {
    it("delegates to financialService.getProfitMargins", async () => {
      financialService.getProfitMargins.mockResolvedValue(profitMarginData);

      await service.export("profit-margins", query);

      expect(financialService.getProfitMargins).toHaveBeenCalled();
    });
  });

  describe("unsupported report type", () => {
    it("throws BadRequestException with i18n message", async () => {
      i18n.t.mockReturnValue("Unsupported report type");

      await expect(service.export("unsupported" as ExportReportType, query)).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith("errors.common.unsupportedReportType", {
        args: { type: "unsupported" },
      });
    });
  });

  describe("toCsv", () => {
    it("returns empty string for empty rows (via inventory with zero products)", async () => {
      prisma.product.findMany.mockResolvedValue([] as never);

      const result = await service.export("inventory", query);

      expect(result.buffer.length).toBe(0);
    });

    it("returns CSV string for non-empty rows", async () => {
      i18n.t.mockReturnValue("Metric");
      reportService.getSummary.mockResolvedValue(summaryFixture);

      const result = await service.export("summary", query);

      const csvContent = result.buffer.toString();
      expect(csvContent).toContain('"metric","value"');
      expect(csvContent).toContain('"Metric",');
    });
  });
});

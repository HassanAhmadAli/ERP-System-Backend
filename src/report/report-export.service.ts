import { Injectable, BadRequestException } from "@nestjs/common";
import { Parser } from "json2csv";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { ReportService } from "./report.service";
import { FinancialService } from "@/financial/financial.service";
import { ReportSummaryQueryDto } from "./dto/report-summary-query.dto";
import { PrismaService } from "@/prisma/prisma.service";

export type ExportFormat = "csv" | "excel" | "pdf";
export type ExportReportType = "summary" | "inventory" | "sales" | "purchases" | "profit-margins";

@Injectable()
export class ReportExportService {
  constructor(
    private readonly reportService: ReportService,
    private readonly financialService: FinancialService,
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async export(
    reportType: ExportReportType,
    query: ReportSummaryQueryDto,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const rows = await this.getReportRows(reportType, query);
    const filename = `${reportType}-${new Date().toISOString().slice(0, 10)}`;

    return {
      buffer: Buffer.from(this.toCsv(rows)),
      contentType: "text/csv",
      filename: `${filename}.csv`,
    };
  }

  private async getReportRows(reportType: ExportReportType, query: ReportSummaryQueryDto) {
    switch (reportType) {
      case "summary": {
        const summary = await this.reportService.getSummary(query);

        return [
          { metric: "Revenue", value: summary.revenue },
          { metric: "Purchases", value: summary.purchases },
          { metric: "Expenses", value: summary.expenses },
          { metric: "Gross Profit", value: summary.grossProfit },
          { metric: "Net Profit", value: summary.netProfit },
          { metric: "Sales Count", value: String(summary.salesCount) },
          { metric: "Low Stock Products", value: String(summary.lowStockProducts) },
          { metric: "Orders Delivered", value: summary.ordersDelivered },
          {
            metric: "Sales By Category",
            value: summary.salesByCategory.map((x) => {
              return { [x.name]: x.revenue };
            }),
          },
          { metric: "Top Products", value: summary.topProducts },
          { metric: "Period", value: summary.period },
        ];
      }
      case "inventory": {
        const products = await this.prisma.product.findMany({
          include: {
            category: { select: { name: true, nameAr: true } },
            supplier: { select: { fullName: true, fullNameAr: true } },
          },
          orderBy: { name: "asc" },
        });
        return products.map((p) => ({
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          barcode: p.barcode,
          category: p.category.name,
          categoryAr: p.category.nameAr,
          supplier: p.supplier.fullName,
          supplierAr: p.supplier.fullNameAr,
          quantityInStock: p.quantityInStock,
          minQuantity: p.minQuantity,
          purchasePrice: p.purchasePrice.toFixed(2),
          sellingPrice: p.sellingPrice.toFixed(2),
          lowStock: p.quantityInStock <= p.minQuantity ? "yes" : "no",
        }));
      }
      case "sales": {
        const summary = await this.reportService.getSummary(query);
        return summary.topProducts.map((p) => ({
          productId: p.productId,
          name: p.name,
          quantitySold: p.quantitySold,
          revenue: p.revenue,
        }));
      }
      case "purchases": {
        const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
        if (query.from != undefined || query.to != undefined) {
          where.createdAt = {};
          if (query.from != undefined) {
            where.createdAt.gte = query.from;
          }
          if (query.to != undefined) {
            where.createdAt.lte = query.to;
          }
        }

        const invoices = await this.prisma.purchaseInvoice.findMany({
          where,
          select: {
            id: true,
            total: true,
            status: true,
            invoiceDate: true,
            createdAt: true,
            supplier: { select: { fullName: true, fullNameAr: true } },
            accountant: { include: { user: { select: { fullName: true, fullNameAr: true } } } },
          },
          orderBy: { createdAt: "desc" },
        });

        return invoices.map((inv) => ({
          id: inv.id,
          supplier: inv.supplier.fullName,
          supplierAr: inv.supplier.fullNameAr,
          accountant: inv.accountant.user.fullName,
          accountantAr: inv.accountant.user.fullNameAr,
          total: inv.total.toFixed(2),
          status: inv.status,
          invoiceDate: inv.invoiceDate.toISOString(),
          createdAt: inv.createdAt.toISOString(),
        }));
      }
      case "profit-margins":
        return [this.financialService.getProfitMargins()];
      default:
        throw new BadRequestException(
          this.i18n.t("errors.common.unsupportedReportType", { args: { type: reportType as string } }),
        );
    }
  }

  private toCsv(rows: object[]): string {
    if (rows.length === 0) return "";
    const parser = new Parser();
    return parser.parse(rows);
  }
}

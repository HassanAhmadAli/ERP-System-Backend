import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@/prisma/client";
import { FinancialDateRangeDto } from "./dto/financial-date-range.dto";
import { CostTrendsQueryDto } from "./dto/cost-trends-query.dto";
import { SupplierReportQueryDto } from "./dto/supplier-report-query.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";

@Injectable()
export class FinancialService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async getProfitMargins(query?: PaginationQueryDto) {
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          nameAr: true,
          barcode: true,
          purchasePrice: true,
          sellingPrice: true,
          quantityInStock: true,
          category: { select: { id: true, name: true, nameAr: true } },
        },
        skip: query?.offset,
        take: query?.limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.product.count(),
    ]);

    const data = products.map((p) => {
      const margin = p.sellingPrice.sub(p.purchasePrice);
      const marginPercent = p.sellingPrice.isZero() ? new Prisma.Decimal(0) : margin.div(p.sellingPrice).mul(100);
      return {
        productId: p.id,
        name: p.name,
        nameAr: p.nameAr,
        barcode: p.barcode,
        category: p.category.name,
        categoryAr: p.category.nameAr,
        purchasePrice: p.purchasePrice.toFixed(2),
        sellingPrice: p.sellingPrice.toFixed(2),
        margin: margin.toFixed(2),
        marginPercent: marginPercent.toFixed(2),
        quantityInStock: p.quantityInStock,
      };
    });
    return paginated(data, total, query?.limit || null, query?.offset || null);
  }

  async getCostBreakdown(query: FinancialDateRangeDto) {
    const purchaseWhere: Prisma.PurchaseInvoiceWhereInput = { status: "COMPLETED" };
    const expenseWhere: Prisma.ExpenseWhereInput = {};
    const salesWhere: Prisma.SalesInvoiceWhereInput = { status: "COMPLETED" };

    if (query.from != undefined || query.to != undefined) {
      const createdAt: Prisma.DateTimeFilter = {};
      const expenseDate: Prisma.DateTimeFilter = {};
      if (query.from != undefined) {
        createdAt.gte = query.from;
        expenseDate.gte = query.from;
      }
      if (query.to != undefined) {
        createdAt.lte = query.to;
        expenseDate.lte = query.to;
      }
      purchaseWhere.createdAt = createdAt;
      salesWhere.createdAt = createdAt;
      expenseWhere.expenseDate = expenseDate;
    }

    const [purchases, expenses, sales, discountAgg] = await Promise.all([
      /*purchases*/ this.prisma.purchaseInvoice.aggregate({ where: purchaseWhere, _sum: { total: true } }),
      /*expenses*/ this.prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
      /*sales*/ this.prisma.salesInvoice.aggregate({
        where: salesWhere,
        _sum: { total: true, discountAmount: true, subtotal: true },
      }),
      /*discountAgg*/ this.prisma.salesInvoice.aggregate({
        where: salesWhere,
        _sum: { discountAmount: true },
      }),
    ]);

    const revenue = sales._sum.total ?? new Prisma.Decimal(0);
    const purchaseTotal = purchases._sum.total ?? new Prisma.Decimal(0);
    const expenseTotal = expenses._sum.amount ?? new Prisma.Decimal(0);
    const discountsGiven = discountAgg._sum.discountAmount ?? new Prisma.Decimal(0);

    return {
      period: { from: query.from?.toISOString() ?? null, to: query.to?.toISOString() ?? null },
      revenue: revenue.toFixed(2),
      purchasingCosts: purchaseTotal.toFixed(2),
      operatingExpenses: expenseTotal.toFixed(2),
      discountsGiven: discountsGiven.toFixed(2),
      grossProfit: revenue.sub(purchaseTotal).toFixed(2),
      netProfit: revenue.sub(purchaseTotal).sub(expenseTotal).toFixed(2),
    };
  }

  async getCostTrends(query: CostTrendsQueryDto) {
    const { productId, from, to, groupBy } = query;

    const items = await this.prisma.purchaseItem.findMany({
      where: {
        productId,
        purchase: { status: "COMPLETED", createdAt: { gte: from, lte: to } },
      },
      include: {
        product: { select: { id: true, name: true, nameAr: true } },
        purchase: { select: { createdAt: true } },
      },
      orderBy: { purchase: { createdAt: "asc" } },
    });

    const buckets = new Map<string, { period: string; totalCost: Prisma.Decimal; quantity: number }>();

    for (const item of items) {
      const date = item.purchase.createdAt;
      const key = this.periodKey(date, groupBy);
      const existing = buckets.get(key);
      if (existing) {
        existing.totalCost = existing.totalCost.add(item.subtotal);
        existing.quantity += item.quantity;
      } else {
        buckets.set(key, { period: key, totalCost: item.subtotal, quantity: item.quantity });
      }
    }

    return [...buckets.values()].map((b) => ({
      period: b.period,
      totalCost: b.totalCost.toFixed(2),
      quantity: b.quantity,
      averageUnitCost: b.quantity > 0 ? b.totalCost.div(b.quantity).toFixed(2) : "0.00",
    }));
  }

  async recalculateCosts(productIds?: number[]) {
    const where: Prisma.ProductWhereInput = {};
    if (productIds != undefined) {
      where.id = { in: productIds };
    }
    const products = await this.prisma.product.findMany({
      where,
      select: { id: true, name: true, nameAr: true, purchasePrice: true },
    });
    type recalculateCostsResultType = {
      productId: number;
      name: string;
      nameAr: string | null;
      oldCost: string;
      newCost: string;
    };
    const results: recalculateCostsResultType[] = [];

    for (const product of products) {
      const latestPurchase = await this.prisma.purchaseItem.findFirst({
        where: { productId: product.id, purchase: { status: "COMPLETED" } },
        orderBy: { purchase: { createdAt: "desc" } },
        select: { unitCost: true },
      });

      if (!latestPurchase) continue;

      const updated = await this.prisma.product.update({
        where: { id: product.id },
        data: { purchasePrice: latestPurchase.unitCost },
      });

      results.push({
        productId: product.id,
        name: product.name,
        nameAr: product.nameAr,
        oldCost: product.purchasePrice.toFixed(2),
        newCost: updated.purchasePrice.toFixed(2),
      });
    }

    return { updated: results.length, products: results };
  }

  async getSupplierReport(query: SupplierReportQueryDto) {
    const supplier = await this.prisma.supplier.findUniqueOrThrow({
      where: { id: query.supplierId },
    });

    const where: Prisma.PurchaseInvoiceWhereInput = {
      supplierId: query.supplierId,
      status: "COMPLETED",
    };

    if (query.from != undefined || query.to != undefined) {
      where.createdAt = {};
      if (query.from != undefined) where.createdAt.gte = query.from;
      if (query.to != undefined) where.createdAt.lte = query.to;
    }

    const [invoices, aggregate] = await Promise.all([
      this.prisma.purchaseInvoice.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true, nameAr: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseInvoice.aggregate({ where, _sum: { total: true }, _count: true }),
    ]);

    return {
      supplier: {
        id: supplier.id,
        fullName: supplier.fullName,
        fullNameAr: supplier.fullNameAr,
        email: supplier.email,
        phone: supplier.phone,
      },
      period: { from: query.from?.toISOString() ?? null, to: query.to?.toISOString() ?? null },
      invoiceCount: aggregate._count,
      totalSpent: (aggregate._sum.total ?? new Prisma.Decimal(0)).toFixed(2),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        total: inv.total.toFixed(2),
        invoiceDate: inv.invoiceDate.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        itemCount: inv.items.length,
      })),
    };
  }

  private periodKey(date: Date, groupBy: "day" | "week" | "month"): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    if (groupBy === "day") return `${y}-${m}-${d}`;
    if (groupBy === "month") return `${y}-${m}`;
    const week = Math.ceil(date.getDate() / 7);
    return `${y}-${m}-W${week}`;
  }
}

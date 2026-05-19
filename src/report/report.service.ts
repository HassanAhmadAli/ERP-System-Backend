import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ReportSummaryQueryDto } from "./dto/report-summary-query.dto";
import { OrderStatus, Prisma } from "@/prisma";

@Injectable()
export class ReportService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async getSummary(query: ReportSummaryQueryDto) {
    const salesWhere: Prisma.SalesInvoiceWhereInput = { status: "COMPLETED" };
    const purchaseWhere: Prisma.PurchaseInvoiceWhereInput = { status: "COMPLETED" };
    const expenseWhere: Prisma.ExpenseWhereInput = {};
    const orderWhere: Prisma.OrderWhereInput = { status: "DELIVERED" };

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
      salesWhere.createdAt = createdAt;
      purchaseWhere.createdAt = createdAt;
      expenseWhere.expenseDate = expenseDate;
      orderWhere.createdAt = createdAt;
    }

    const [
      salesAgg,
      purchaseAgg,
      expenseAgg,
      salesCount,
      orderCount,
      lowStockCount,
      topProductsAgg,
      allProductSalesAgg,
    ] = await Promise.all([
      this.prisma.salesInvoice.aggregate({
        where: salesWhere,
        _sum: { total: true },
      }),
      this.prisma.purchaseInvoice.aggregate({
        where: purchaseWhere,
        _sum: { total: true },
      }),
      this.prisma.expense.aggregate({
        where: expenseWhere,
        _sum: { amount: true },
      }),
      this.prisma.salesInvoice.count({ where: salesWhere }),
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.product.count({
        where: {
          quantityInStock: { lte: this.prisma.product.fields.minQuantity },
        },
      }),
      this.prisma.saleItem.groupBy({
        by: ["productId"],
        where: { invoice: salesWhere },
        _sum: { subtotal: true, quantity: true },
        orderBy: { _sum: { subtotal: "desc" } },
        take: 10,
      }),
      this.prisma.saleItem.groupBy({
        by: ["productId"],
        where: { invoice: salesWhere },
        _sum: { subtotal: true },
      }),
    ]);

    const revenue = salesAgg._sum.total ?? new Prisma.Decimal(0);
    const purchases = purchaseAgg._sum.total ?? new Prisma.Decimal(0);
    const expenses = expenseAgg._sum.amount ?? new Prisma.Decimal(0);
    const grossProfit = revenue.sub(purchases);
    const netProfit = grossProfit.sub(expenses);
    const [products, productsWithCategory] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: topProductsAgg.map((p) => p.productId) } },
        select: { id: true, name: true },
      }),
      this.prisma.product.findMany({
        where: { id: { in: allProductSalesAgg.map((p) => p.productId) } },
        select: {
          id: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
        },
      }),
    ]);

    const topProducts = topProductsAgg.map((agg) => {
      const product = products.find((p) => p.id === agg.productId);
      return {
        productId: agg.productId,
        name: product?.name ?? `Deleted Product (ID: ${agg.productId})`,
        quantitySold: agg._sum.quantity ?? 0,
        revenue: (agg._sum.subtotal ?? new Prisma.Decimal(0)).toFixed(2),
      };
    });
    const categoryMap = new Map<number, { categoryId: number; name: string; revenue: Prisma.Decimal }>();
    for (const agg of allProductSalesAgg) {
      const product = productsWithCategory.find((p) => p.id === agg.productId);
      const categoryId = product?.categoryId ?? 0;
      const categoryName = product?.category?.name ?? "Uncategorized";
      const revenue = agg._sum.subtotal ?? new Prisma.Decimal(0);

      const existing = categoryMap.get(categoryId);
      if (existing) {
        existing.revenue = existing.revenue.add(revenue);
      } else {
        categoryMap.set(categoryId, { categoryId, name: categoryName, revenue });
      }
    }
    const salesByCategory = [...categoryMap.values()]
      .sort((a, b) => {
        if (b.revenue.equals(a.revenue)) return 0;
        return b.revenue.gt(a.revenue) ? 1 : -1;
      })
      .map((c) => ({
        ...c,
        revenue: c.revenue.toFixed(2),
      }));

    // --- 3. RETURN DATA ---
    return {
      period: {
        from: query.from?.toISOString() ?? null,
        to: query.to?.toISOString() ?? null,
      },
      revenue: revenue.toFixed(2),
      purchases: purchases.toFixed(2),
      expenses: expenses.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      netProfit: netProfit.toFixed(2),
      salesCount,
      ordersDelivered: orderCount,
      lowStockProducts: lowStockCount,
      topProducts,
      salesByCategory,
    };
  }

  async getDashboard() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const salesTodayWhere: Prisma.SalesInvoiceWhereInput = {
      status: "COMPLETED",
      createdAt: { gte: startOfToday, lte: endOfToday },
    };

    const pendingOrderStatuses: OrderStatus[] = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY"];

    const [salesTodayAgg, salesTodayCount, pendingOrders, lowStockProducts] = await Promise.all([
      this.prisma.salesInvoice.aggregate({
        where: salesTodayWhere,
        _sum: { total: true },
      }),
      this.prisma.salesInvoice.count({ where: salesTodayWhere }),
      this.prisma.order.count({
        where: { status: { in: pendingOrderStatuses } },
      }),
      this.prisma.product.count({
        where: {
          quantityInStock: { lte: this.prisma.product.fields.minQuantity },
        },
      }),
    ]);

    const revenueToday = salesTodayAgg._sum.total ?? new Prisma.Decimal(0);

    return {
      date: startOfToday.toISOString().slice(0, 10),
      lowStockProducts,
      salesToday: {
        count: salesTodayCount,
        revenue: revenueToday.toFixed(2),
      },
      pendingOrders,
    };
  }

  async getInventoryReport() {
    const [products, lowStockCount, outOfStockCount] = await Promise.all([
      this.prisma.product.findMany({
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, fullName: true } },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.product.count({
        where: { quantityInStock: { lte: this.prisma.product.fields.minQuantity, gt: 0 } },
      }),
      this.prisma.product.count({ where: { quantityInStock: 0 } }),
    ]);

    const stockValue = products.reduce(
      (sum, p) => sum.add(p.purchasePrice.mul(p.quantityInStock)),
      new Prisma.Decimal(0),
    );

    return {
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      stockValue: stockValue.toFixed(2),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category.name,
        supplier: p.supplier.fullName,
        quantityInStock: p.quantityInStock,
        minQuantity: p.minQuantity,
        purchasePrice: p.purchasePrice.toFixed(2),
        sellingPrice: p.sellingPrice.toFixed(2),
        stockStatus: p.quantityInStock === 0 ? "out_of_stock" : p.quantityInStock <= p.minQuantity ? "low" : "ok",
      })),
    };
  }
}

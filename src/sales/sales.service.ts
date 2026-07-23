import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

import { DiscountService } from "@/discount/discount.service";
import { CreateSalesInvoiceDto } from "./dto/create-sales-invoice.dto";
import { UpdateSalesInvoiceStatusDto } from "./dto/update-sales-invoice-status.dto";
import { SalesInvoiceQueryDto } from "./dto/sales-invoice-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { InvoiceStatus, Prisma, UserRole } from "@/prisma/client";
import { NotificationsService } from "../notification/notification.service";

type PrismaTransaction = Parameters<Parameters<PrismaService["client"]["$transaction"]>[0]>[0];

const invoiceInclude = {
  items: { include: { product: { select: { id: true, name: true, barcode: true } } } },
  cashier: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  customer: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  appliedDiscount: { select: { id: true, name: true } },
} satisfies Prisma.SalesInvoiceInclude;

@Injectable()
export class SalesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly discountService: DiscountService,
    private readonly notificationsService: NotificationsService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(userId: number, dto: CreateSalesInvoiceDto) {
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { userId },
    });

    if (dto.customerId != undefined) {
      await this.prisma.customer.findUniqueOrThrow({ where: { id: dto.customerId } });
    }

    const status: InvoiceStatus = dto.complete ? "COMPLETED" : "PENDING";

    return this.prisma.$transaction(async (tx) => {
      const lineItems = await this.buildLineItems(tx, dto.items, status === "COMPLETED");

      const subtotal = lineItems.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));

      let discountAmount = new Prisma.Decimal(0);
      let appliedDiscountId: number | null = null;

      if (dto.discountId != undefined) {
        discountAmount = await this.discountService.calculateOrderDiscount({
          discountId: dto.discountId,
          customerId: dto.customerId,
          items: dto.items,
        });

        // If discount is applicable (non-zero), validate and save the reference
        if (discountAmount.gt(0)) {
          appliedDiscountId = dto.discountId;
          // Validate the discount is still usable before finalizing
          await this.discountService.validateDiscountUsable(dto.discountId);
        }
      }

      const total = subtotal.sub(discountAmount);

      const invoice = await tx.salesInvoice.create({
        data: {
          cashierId: employee.id,
          customerId: dto.customerId,
          appliedDiscountId: appliedDiscountId,
          subtotal,
          discountAmount,
          total,
          status,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: item.subtotal,
            })),
          },
        },
        include: invoiceInclude,
      });

      if (status === "COMPLETED") {
        await this.applyCompletionEffects(tx, invoice);
      }

      return invoice;
    });
  }

  async findAll(query: SalesInvoiceQueryDto) {
    const where: Prisma.SalesInvoiceWhereInput = {};

    if (query.status != undefined) {
      where.status = query.status;
    }
    if (query.cashierId != undefined) {
      where.cashierId = query.cashierId;
    }
    if (query.from != undefined || query.to != undefined) {
      where.createdAt = {};
      if (query.from != undefined) {
        where.createdAt.gte = query.from;
      }
      if (query.to != undefined) {
        where.createdAt.lte = query.to;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.salesInvoice.findMany({
        where,
        include: invoiceInclude,
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.salesInvoice.count({ where }),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }

  async findOne(id: number) {
    return this.prisma.salesInvoice.findUniqueOrThrow({
      where: { id },
      include: invoiceInclude,
    });
  }

  async updateStatus(id: number, { status }: UpdateSalesInvoiceStatusDto, userId: number, role: UserRole) {
    const invoice = await this.prisma.salesInvoice.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });

    if (role === UserRole.CASHIER) {
      const employee = await this.prisma.employee.findUniqueOrThrow({
        where: { userId },
        select: { id: true },
      });
      if (invoice.cashierId !== employee.id) {
        throw new ForbiddenException(this.i18n.t("errors.sales.canOnlyUpdateOwn"));
      }
    }

    if (invoice.status === "CANCELLED" || invoice.status === "REFUNDED") {
      throw new BadRequestException(
        this.i18n.t("errors.sales.cannotUpdateStatus", { args: { status: invoice.status } }),
      );
    }

    if (status === invoice.status) {
      return this.findOne(id);
    }

    this.validateStatusTransition(invoice.status, status);

    return this.prisma.$transaction(async (tx) => {
      if (status === "COMPLETED" && invoice.status === "PENDING") {
        for (const item of invoice.items) {
          const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
          if (product.quantityInStock < item.quantity) {
            throw new BadRequestException(
              this.i18n.t("errors.sales.insufficientStock", {
                args: { name: product.name, stock: product.quantityInStock },
              }),
            );
          }
        }
      }

      const updated = await tx.salesInvoice.update({
        where: { id },
        data: { status },
        include: invoiceInclude,
      });

      if (status === "COMPLETED" && invoice.status === "PENDING") {
        await this.applyCompletionEffects(tx, updated);
      } else if (status === "REFUNDED" && invoice.status === "COMPLETED") {
        await this.applyRefundEffects(tx, updated);
      }

      return updated;
    });
  }

  private validateStatusTransition(current: InvoiceStatus, next: InvoiceStatus) {
    const allowed: Record<InvoiceStatus, InvoiceStatus[]> = {
      PENDING: ["COMPLETED", "CANCELLED"],
      COMPLETED: ["REFUNDED"],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(this.i18n.t("errors.sales.invalidTransition", { args: { current, next } }));
    }
  }

  private async buildLineItems(tx: PrismaTransaction, items: CreateSalesInvoiceDto["items"], validateStock: boolean) {
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    const uniqueProductIds = [...new Set(productIds)];

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException(this.i18n.t("errors.sales.productsNotFound"));
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = productMap.get(item.productId)!;

      if (validateStock && product.quantityInStock < item.quantity) {
        throw new BadRequestException(
          this.i18n.t("errors.sales.insufficientStock", {
            args: { name: product.name, stock: product.quantityInStock },
          }),
        );
      }

      const unitPrice = product.sellingPrice;
      const subtotal = unitPrice.mul(item.quantity);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discount: new Prisma.Decimal(0),
        subtotal,
        categoryId: product.categoryId,
      };
    });
  }

  private async applyCompletionEffects(
    tx: PrismaTransaction,
    invoice: Prisma.SalesInvoiceGetPayload<{ include: typeof invoiceInclude }>,
  ) {
    for (const item of invoice.items) {
      const updatedProduct = await tx.product.update({
        where: { id: item.productId },
        data: { quantityInStock: { decrement: item.quantity } },
      });

      if (updatedProduct.quantityInStock <= updatedProduct.minQuantity) {
        const warehouseWorkers = await tx.user.findMany({
          where: {
            role: UserRole.WAREHOUSE_WORKER,
            isActive: true,
            deletedAt: null,
          },
          select: { id: true, email: true },
        });

        for (const worker of warehouseWorkers) {
          if (!worker.email) continue;
          await this.notificationsService.addNotification(
            {
              title: "Low stock alert",
              userId: worker.id,
              email: worker.email,
              message: `Product "${updatedProduct.name}" is low on stock (${updatedProduct.quantityInStock} remaining)`,
              type: "warning",
              createdAt: new Date(),
            },
            "send-notification",
          );
        }
      }
    }

    if (invoice.customerId != undefined) {
      const total = invoice.total;
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalSpent: { increment: invoice.total },
          loyaltyPoints: { increment: total.toNumber() },
        },
      });
    }

    if (invoice.appliedDiscountId != undefined) {
      await this.discountService.incrementUsage(invoice.appliedDiscountId);
    }
  }

  private async applyRefundEffects(
    tx: PrismaTransaction,
    invoice: Prisma.SalesInvoiceGetPayload<{ include: typeof invoiceInclude }>,
  ) {
    for (const item of invoice.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantityInStock: { increment: item.quantity } },
      });
    }

    if (invoice.customerId != undefined) {
      const total = invoice.total;
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalSpent: { decrement: invoice.total },
          loyaltyPoints: { decrement: total.toNumber() },
        },
      });
    }

    // Decrement discount usage count if a discount was applied
    if (invoice.appliedDiscountId != undefined) {
      await tx.discount.update({
        where: { id: invoice.appliedDiscountId },
        data: { usedCount: { decrement: 1 } },
      });
    }
  }
}

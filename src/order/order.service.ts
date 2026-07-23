import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { DiscountService } from "@/discount/discount.service";
import { CreateCashierOrderDto, CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { OrderStatus, Prisma, UserRole } from "@/prisma/client";
import { NotificationsService } from "@/notification/notification.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

type PrismaTransaction = Parameters<Parameters<PrismaService["client"]["$transaction"]>[0]>[0];

const orderInclude = {
  items: { include: { product: { select: { id: true, name: true, nameAr: true, barcode: true } } } },
  customer: { include: { user: { select: { id: true, fullName: true, fullNameAr: true, email: true } } } },
  appliedDiscount: { select: { id: true, name: true, nameAr: true } },
} satisfies Prisma.OrderInclude;

const STOCK_RESERVED_STATUSES: OrderStatus[] = [
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly discountService: DiscountService,
    private readonly notificationsService: NotificationsService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async createCustomerOrder(userId: number, dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });
    return await this.createOrder(customer.id, dto);
  }

  async createOrder(customerId: number, dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: { user: { select: { id: true, email: true } } },
    });

    return this.prisma.$transaction(async (tx) => {
      const lineItems = await this.buildLineItems(tx, dto.items, true);
      const subtotal = lineItems.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));

      let appliedDiscountId: number | undefined;
      let discountAmount = new Prisma.Decimal(0);
      if (dto.discountId != undefined) {
        discountAmount = await this.discountService.calculateOrderDiscount({
          discountId: dto.discountId,
          customerId,
          items: dto.items,
        });
        if (discountAmount.gt(0)) {
          appliedDiscountId = dto.discountId;
          await this.discountService.validateDiscountUsable(dto.discountId);
        }
      }

      const order = await tx.order.create({
        data: {
          customerId,
          appliedDiscountId,
          subtotal,
          deliveryAddress: dto.deliveryAddress ?? customer.address,
          deliveryAddressAr: dto.deliveryAddressAr ?? customer.addressAr,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        include: orderInclude,
      });

      await this.notifyOrderStatus(customer.user.id, customer.user.email, order.id, order.status);
      return { ...order, discountAmount: discountAmount };
    });
  }

  async findAll(userId: number, role: UserRole, query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {};

    if (role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUniqueOrThrow({
        where: { userId },
        select: { id: true },
      });

      where.customerId = customer.id;
    } else if (query.customerId != undefined) {
      where.customerId = query.customerId;
    }

    if (query.status != undefined) {
      where.status = query.status;
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
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }

  async findOne(id: number, userId: number, role: UserRole) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: orderInclude,
    });

    if (role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!customer || order.customerId !== customer.id) {
        throw new ForbiddenException(this.i18n.t("errors.order.noAccess"));
      }
    }

    return order;
  }

  async cancelOwn(userId: number, id: number) {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });

    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      select: { customerId: true, status: true },
    });

    if (order.customerId !== customer.id) {
      throw new ForbiddenException(this.i18n.t("errors.order.cannotCancelOwn"));
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.OUT_FOR_DELIVERY
    ) {
      throw new BadRequestException(this.i18n.t("errors.order.cancelStatusInvalid"));
    }

    return this.updateStatus(id, { status: OrderStatus.CANCELLED });
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: true, customer: { include: { user: true } } },
    });

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(this.i18n.t("errors.order.cannotUpdateStatus", { args: { status: order.status } }));
    }

    if (dto.status === order.status) {
      return this.prisma.order.findUniqueOrThrow({
        where: { id },
        include: orderInclude,
      });
    }

    this.validateStatusTransition(order.status, dto.status);

    return this.prisma.$transaction(async (tx) => {
      const wasStockReserved = STOCK_RESERVED_STATUSES.includes(order.status);
      const willReserveStock = dto.status === OrderStatus.PREPARING;
      const willReleaseStock = dto.status === OrderStatus.CANCELLED && wasStockReserved;
      const willComplete = dto.status === OrderStatus.DELIVERED;
      const wasCompleted = order.status === OrderStatus.DELIVERED;

      if (willReserveStock && order.status === OrderStatus.PENDING) {
        for (const item of order.items) {
          const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
          if (product.quantityInStock < item.quantity) {
            throw new BadRequestException(
              this.i18n.t("errors.order.insufficientStock", {
                args: { name: product.name, stock: product.quantityInStock },
              }),
            );
          }
        }
        await this.adjustStock(tx, order.items, "decrement");
      }

      if (willReleaseStock) {
        await this.adjustStock(tx, order.items, "increment");
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: dto.status },
        include: orderInclude,
      });

      if (willComplete) {
        let discountAmount = new Prisma.Decimal(0);
        if (order.appliedDiscountId != undefined) {
          discountAmount = await this.discountService.calculateOrderDiscount({
            discountId: order.appliedDiscountId,
            customerId: order.customerId,
            items: order.items,
          });
        }

        // Increment discount usage count
        if (order.appliedDiscountId != undefined) {
          await this.discountService.incrementUsage(order.appliedDiscountId);
        }
      }

      // Handle cancellation after delivery (refund scenario)
      if (dto.status === OrderStatus.CANCELLED && wasCompleted) {
        // Recalculate discount to reverse customer totals accurately
        let discountAmount = new Prisma.Decimal(0);
        if (order.appliedDiscountId != undefined) {
          discountAmount = await this.discountService.calculateOrderDiscount({
            discountId: order.appliedDiscountId,
            customerId: order.customerId,
            items: order.items,
          });
        }

        // Decrement discount usage count
        if (order.appliedDiscountId != undefined) {
          await tx.discount.update({
            where: { id: order.appliedDiscountId },
            data: { usedCount: { decrement: 1 } },
          });
        }
      }

      await this.notifyOrderStatus(order.customer.user.id, order.customer.user.email, updated.id, updated.status);

      return updated;
    });
  }

  private validateStatusTransition(current: OrderStatus, next: OrderStatus) {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      PREPARING: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(this.i18n.t("errors.order.invalidTransition", { args: { current, next } }));
    }
  }

  private async buildLineItems(tx: PrismaTransaction, items: CreateCashierOrderDto["items"], validateStock: boolean) {
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });
    const uniqueProductIds = [...new Set(productIds)];

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException(this.i18n.t("errors.order.productsNotFound"));
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (validateStock && product.quantityInStock < item.quantity) {
        throw new BadRequestException(
          this.i18n.t("errors.order.insufficientStock", {
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
        subtotal,
        categoryId: product.categoryId,
      };
    });
  }

  private async adjustStock(
    tx: PrismaTransaction,
    items: Array<{ productId: number; quantity: number }>,
    direction: "increment" | "decrement",
  ) {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantityInStock: direction === "decrement" ? { decrement: item.quantity } : { increment: item.quantity },
        },
      });
    }
  }

  private async notifyOrderStatus(userId: number, email: string, orderId: number, status: OrderStatus) {
    await this.notificationsService.addNotification(
      {
        title: this.i18n.t("notifications.order.statusUpdatedTitle"),
        userId,
        email,
        message: this.i18n.t("notifications.order.statusUpdatedBody", {
          args: { orderId, status },
        }),
        type: "info",
        createdAt: new Date(),
      },
      "send-notification",
    );
  }
}

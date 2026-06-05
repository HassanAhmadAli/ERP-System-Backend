import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { DiscountService } from "@/discount/discount.service";
import { CreateCashierOrderDto, CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { OrderStatus, Prisma, UserRole } from "@/prisma";
import { NotificationsService } from "@/notification/notification.service";
import { LoyaltyPolicyService } from "@/loyalty-reward/loyalty-policy.service";

type PrismaTransaction = Parameters<Parameters<PrismaService["client"]["$transaction"]>[0]>[0];

const orderInclude = {
  items: { include: { product: { select: { id: true, name: true, barcode: true } } } },
  customer: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  appliedDiscount: { select: { id: true, name: true } },
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
    private readonly loyaltyPolicyService: LoyaltyPolicyService,
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

    if (dto.loyaltyPointsUsed > customer.loyaltyPoints) {
      throw new BadRequestException("Insufficient loyalty points");
    }

    return this.prisma.$transaction(async (tx) => {
      const lineItems = await this.buildLineItems(tx, dto.items, true);
      const subtotal = lineItems.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));

      let appliedDiscountId: number | undefined;
      let discountAmount = new Prisma.Decimal(0);
      if (dto.discountId != undefined) {
        discountAmount = await this.discountService.calculateOrderDiscount({
          discountId: dto.discountId,
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
          loyaltyPointsUsed: dto.loyaltyPointsUsed,
          deliveryAddress: dto.deliveryAddress ?? customer.address,
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
      return { ...order, discountAmount };
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
        throw new ForbiddenException("You do not have access to this order");
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
      throw new ForbiddenException("You can only cancel your own orders");
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.OUT_FOR_DELIVERY
    ) {
      throw new BadRequestException(
        "Only orders in 'pending', 'preparing' or 'out for delivery' status can be cancelled",
      );
    }

    return this.updateStatus(id, { status: OrderStatus.CANCELLED });
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: true, customer: { include: { user: true } } },
    });

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update order in ${order.status} status`);
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
              `Insufficient stock for product "${product.name}" (available: ${product.quantityInStock})`,
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
            items: order.items,
          });
        }

        const total = order.subtotal.sub(discountAmount);
        const loyaltyEarned = await this.loyaltyPolicyService.calculateEarnedPoints(total);
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: { increment: total },
            loyaltyPoints: { increment: loyaltyEarned },
          },
        });

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
            items: order.items,
          });
        }

        const total = order.subtotal.sub(discountAmount);

        // Reverse customer totals and loyalty points
        const loyaltyEarned = await this.loyaltyPolicyService.calculateEarnedPoints(total);
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: { decrement: total },
            loyaltyPoints: { decrement: loyaltyEarned },
          },
        });

        // Decrement discount usage count
        if (order.appliedDiscountId != undefined) {
          await tx.discount.update({
            where: { id: order.appliedDiscountId },
            data: { usedCount: { decrement: 1 } },
          });
        }
      }

      // Restore loyalty points used for any cancellation
      if (dto.status === OrderStatus.CANCELLED && order.loyaltyPointsUsed > 0) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { loyaltyPoints: { increment: order.loyaltyPointsUsed } },
        });
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
      throw new BadRequestException(`Cannot transition order from ${current} to ${next}`);
    }
  }

  private async buildLineItems(tx: PrismaTransaction, items: CreateCashierOrderDto["items"], validateStock: boolean) {
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });
    const uniqueProductIds = [...new Set(productIds)];

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException("One or more products were not found");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (validateStock && product.quantityInStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}" (available: ${product.quantityInStock})`,
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
        title: "Order status updated",
        userId,
        email,
        message: `Your order #${orderId} is now ${status}`,
        type: "info",
        createdAt: new Date(),
      },
      "send-notification",
    );
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { DiscountService } from "@/discount/discount.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { OrderStatus, Prisma, UserRole } from "@/prisma";
import { NotificationsService } from "@/notification/notification.service";

type PrismaTransaction = Parameters<Parameters<PrismaService["client"]["$transaction"]>[0]>[0];

const orderInclude = {
  items: { include: { product: { select: { id: true, name: true, barcode: true } } } },
  customer: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  appliedDiscount: { select: { id: true, name: true } },
} satisfies Prisma.OrderInclude;

const STOCK_RESERVED_STATUSES: OrderStatus[] = ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly discountService: DiscountService,
    private readonly notificationsService: NotificationsService,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(userId: number, role: UserRole, dto: CreateOrderDto) {
    const customerId = await this.resolveCustomerId(userId, role, dto.customerId);
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

      let discountAmount = new Prisma.Decimal(0);
      let appliedDiscountId: number | undefined;

      if (dto.discountId != undefined) {
        const discountResult = await this.discountService.calculateDiscount({
          discountId: dto.discountId,
          subtotal: subtotal.toNumber(),
          customerId,
        });
        discountAmount = new Prisma.Decimal(discountResult.discountAmount);
        appliedDiscountId = dto.discountId;
      }

      let total = subtotal.sub(discountAmount);

      if (dto.loyaltyPointsUsed > 0) {
        const loyaltyCredit = new Prisma.Decimal(dto.loyaltyPointsUsed);
        if (loyaltyCredit.gt(total)) {
          throw new BadRequestException("Loyalty points cannot exceed order total");
        }
        total = total.sub(loyaltyCredit);
      }

      const order = await tx.order.create({
        data: {
          customerId,
          appliedDiscountId,
          subtotal,
          discountAmount,
          total,
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

      if (dto.loyaltyPointsUsed > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { decrement: dto.loyaltyPointsUsed } },
        });
      }

      await this.notifyOrderStatus(customer.user.id, customer.user.email, order.id, order.status);

      return order;
    });
  }

  async findAll(userId: number, role: UserRole, query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {};

    if (role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!customer) {
        throw new BadRequestException("Customer profile not found");
      }
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

    return paginated(data, total);
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

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, customer: { include: { user: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
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
      const willReserveStock = dto.status === "PREPARING";
      const willReleaseStock = dto.status === "CANCELLED" && wasStockReserved;
      const willComplete = dto.status === "DELIVERED";

      if (willReserveStock && order.status === "PENDING") {
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
        const loyaltyEarned = Math.floor(order.total.toNumber());
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: { increment: order.total },
            loyaltyPoints: { increment: loyaltyEarned },
          },
        });

        if (order.appliedDiscountId != undefined) {
          const discount = await tx.discount.findUniqueOrThrow({
            where: { id: order.appliedDiscountId },
          });
          if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
            throw new BadRequestException("This discount has reached its maximum number of uses");
          }
          await tx.discount.update({
            where: { id: order.appliedDiscountId },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      if (dto.status === "CANCELLED" && order.loyaltyPointsUsed > 0) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { loyaltyPoints: { increment: order.loyaltyPointsUsed } },
        });
      }

      await this.notifyOrderStatus(order.customer.user.id, order.customer.user.email, updated.id, updated.status);

      return updated;
    });
  }

  private async resolveCustomerId(userId: number, role: UserRole, customerId?: number) {
    if (role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!customer) {
        throw new BadRequestException("Customer profile not found");
      }
      if (customerId != undefined && customerId !== customer.id) {
        throw new ForbiddenException("Customers can only create orders for themselves");
      }
      return customer.id;
    }

    if (customerId == undefined) {
      throw new BadRequestException("customerId is required when creating orders for customers");
    }

    await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    return customerId;
  }

  private validateStatusTransition(current: OrderStatus, next: OrderStatus) {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ["PREPARING", "CANCELLED"],
      PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
      OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`Cannot transition order from ${current} to ${next}`);
    }
  }

  private async buildLineItems(tx: PrismaTransaction, items: CreateOrderDto["items"], validateStock: boolean) {
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

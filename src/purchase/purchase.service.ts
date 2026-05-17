import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreatePurchaseInvoiceDto } from "./dto/create-purchase-invoice.dto";
import { UpdatePurchaseInvoiceStatusDto } from "./dto/update-purchase-invoice-status.dto";
import { PurchaseInvoiceQueryDto } from "./dto/purchase-invoice-query.dto";
import { InvoiceStatus, Prisma } from "@/prisma";

type PrismaTransaction = Parameters<Parameters<PrismaService["client"]["$transaction"]>[0]>[0];

const purchaseInclude = {
  items: { include: { product: { select: { id: true, name: true, barcode: true } } } },
  supplier: { select: { id: true, fullName: true, email: true, phone: true } },
  accountant: { include: { user: { select: { id: true, fullName: true, email: true } } } },
} satisfies Prisma.PurchaseInvoiceInclude;

@Injectable()
export class PurchaseService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(userId: number, dto: CreatePurchaseInvoiceDto) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) {
      throw new BadRequestException("User is not registered as an employee");
    }

    await this.prisma.supplier.findUniqueOrThrow({ where: { id: dto.supplierId } });

    const status: InvoiceStatus = dto.receive ? "COMPLETED" : "PENDING";

    return this.prisma.$transaction(async (tx) => {
      const lineItems = await this.buildLineItems(tx, dto.supplierId, dto.items);
      const total = lineItems.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));

      const invoice = await tx.purchaseInvoice.create({
        data: {
          supplierId: dto.supplierId,
          accountantId: employee.id,
          total,
          status,
          invoiceDate: dto.invoiceDate,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.subtotal,
              expiryDate: item.expiryDate,
            })),
          },
        },
        include: purchaseInclude,
      });

      if (status === "COMPLETED") {
        await this.applyReceiveEffects(tx, invoice.items);
      }

      return invoice;
    });
  }

  async findAll(query: PurchaseInvoiceQueryDto) {
    const where: Prisma.PurchaseInvoiceWhereInput = {};

    if (query.status != undefined) {
      where.status = query.status;
    }
    if (query.supplierId != undefined) {
      where.supplierId = query.supplierId;
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
      this.prisma.purchaseInvoice.findMany({
        where,
        include: purchaseInclude,
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseInvoice.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    return this.prisma.purchaseInvoice.findUniqueOrThrow({
      where: { id },
      include: purchaseInclude,
    });
  }

  async updateStatus(id: number, { status }: UpdatePurchaseInvoiceStatusDto) {
    const invoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Purchase invoice with ID ${id} not found`);
    }

    if (invoice.status === "CANCELLED" || invoice.status === "REFUNDED") {
      throw new BadRequestException(`Cannot update purchase invoice in ${invoice.status} status`);
    }

    if (status === invoice.status) {
      return this.findOne(id);
    }

    this.validateStatusTransition(invoice.status, status);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseInvoice.update({
        where: { id },
        data: { status },
        include: purchaseInclude,
      });

      if (status === "COMPLETED" && invoice.status === "PENDING") {
        await this.applyReceiveEffects(tx, invoice.items);
      } else if (status === "REFUNDED" && invoice.status === "COMPLETED") {
        await this.applyRefundEffects(tx, invoice.items);
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
      throw new BadRequestException(`Cannot transition purchase invoice from ${current} to ${next}`);
    }
  }

  private async buildLineItems(tx: PrismaTransaction, supplierId: number, items: CreatePurchaseInvoiceDto["items"]) {
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const uniqueProductIds = [...new Set(productIds)];

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException("One or more products were not found");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = productMap.get(item.productId)!;

      if (product.supplierId !== supplierId) {
        throw new BadRequestException(`Product "${product.name}" does not belong to this supplier`);
      }

      const subtotal = item.unitCost.mul(item.quantity);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal,
        expiryDate: item.expiryDate,
      };
    });
  }

  private async applyReceiveEffects(
    tx: PrismaTransaction,
    items: Array<{ productId: number; quantity: number; unitCost: Prisma.Decimal }>,
  ) {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantityInStock: { increment: item.quantity },
          purchasePrice: item.unitCost,
        },
      });
    }
  }

  private async applyRefundEffects(tx: PrismaTransaction, items: Array<{ productId: number; quantity: number }>) {
    for (const item of items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      if (product.quantityInStock < item.quantity) {
        throw new BadRequestException(`Cannot refund purchase: insufficient stock for "${product.name}"`);
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { quantityInStock: { decrement: item.quantity } },
      });
    }
  }
}

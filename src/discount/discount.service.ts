import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, DiscountType, DiscountScope } from "@/prisma";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { CalculateDiscountDto } from "./dto/calculate-discount.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

export interface DiscountCalculationResult {
  discountId: number;
  discountName: string;
  type: DiscountType;
  scope: DiscountScope;
  subtotal: string;
  discountAmount: string;
  total: string;
}

@Injectable()
export class DiscountService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  // ─── CRUD ──────────────────────────────────────────────────────

  async create(userId: number, createDiscountDto: CreateDiscountDto) {
    const discount = await this.prisma.discount.create({
      data: {
        ...createDiscountDto,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });

    return discount;
  }

  async findAll(paginationQuery: PaginationQueryDto, search?: string) {
    const where: Prisma.DiscountWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        include: { createdBy: { select: { id: true, fullName: true } } },
        skip: paginationQuery.offset,
        take: paginationQuery.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.discount.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const discount = await this.prisma.discount.findUniqueOrThrow({
      where: { id },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });

    return discount;
  }

  async update(id: number, updateDiscountDto: UpdateDiscountDto) {
    await this.prisma.discount.findUniqueOrThrow({ where: { id } });

    const updated = await this.prisma.discount.update({
      where: { id },
      data: updateDiscountDto,
      include: { createdBy: { select: { id: true, fullName: true } } },
    });

    return updated;
  }

  async remove(id: number) {
    await this.prisma.discount.delete({ where: { id } });

    return { message: `Discount with ID ${id} has been deleted successfully` };
  }

  async toggleActive(id: number, isActive: boolean) {
    return await this.prisma.discount.update({
      where: { id },
      data: { isActive },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
  }

  // ─── Active / Valid Discounts ──────────────────────────────────

  async getActiveDiscounts(paginationQuery: PaginationQueryDto) {
    const now = new Date();

    const where: Prisma.DiscountWhereInput = {
      isActive: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
      AND: [
        {
          OR: [{ maxUses: null }, { usedCount: { lt: this.prisma.discount.fields.maxUses } }],
        },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        skip: paginationQuery.offset,
        take: paginationQuery.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.discount.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Discount Calculation Engine ───────────────────────────────

  /**
   * Calculates the discount amount for a given subtotal.
   *
   * Validates:
   *  - Discount exists and is active
   *  - Discount is within its valid date range
   *  - Discount has not exceeded its max uses
   *  - Scope matches the provided context (productId, categoryId, customerId)
   *  - For PERCENTAGE type: caps at maxInvoiceValue if set
   *  - For FIXED_AMOUNT type: caps at the subtotal (discount cannot exceed subtotal)
   */
  async calculateDiscount(dto: CalculateDiscountDto): Promise<DiscountCalculationResult> {
    const discount = await this.prisma.discount.findUniqueOrThrow({
      where: { id: dto.discountId },
    });

    // 1. Validate discount is active
    if (!discount.isActive) {
      throw new BadRequestException("This discount is no longer active");
    }

    // 2. Validate date range
    const now = new Date();
    if (discount.startDate > now) {
      throw new BadRequestException("This discount has not started yet");
    }
    if (discount.endDate && discount.endDate < now) {
      throw new BadRequestException("This discount has expired");
    }

    // 3. Validate usage limit
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException("This discount has reached its maximum number of uses");
    }

    // 4. Validate scope requirements
    this.validateScope(discount.scope, dto);

    // 5. Calculate the discount amount
    const subtotal = new Prisma.Decimal(dto.subtotal);
    let discountAmount: Prisma.Decimal;

    if (discount.type === "PERCENTAGE") {
      // percentage discount: value is a percentage (e.g. 10 = 10%)
      discountAmount = subtotal.mul(discount.value).div(100);

      // cap at maxInvoiceValue if set (maxInvoiceValue > 0)
      if (discount.maxInvoiceValue.gt(0) && discountAmount.gt(discount.maxInvoiceValue)) {
        discountAmount = discount.maxInvoiceValue;
      }
    } else {
      // FIXED_AMOUNT: the discount value is the flat amount
      discountAmount = discount.value;
    }

    // Discount cannot exceed the subtotal
    if (discountAmount.gt(subtotal)) {
      discountAmount = subtotal;
    }

    const total = subtotal.sub(discountAmount);

    return {
      discountId: discount.id,
      discountName: discount.name,
      type: discount.type,
      scope: discount.scope,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2),
    };
  }

  /**
   * Atomically increments the usedCount for a discount.
   * Call this when a discount is actually applied to an invoice/order.
   */
  async incrementUsage(discountId: number) {
    const discount = await this.prisma.discount.findUniqueOrThrow({
      where: { id: discountId },
    });

    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException("This discount has reached its maximum number of uses");
    }

    return this.prisma.discount.update({
      where: { id: discountId },
      data: { usedCount: { increment: 1 } },
    });
  }

  /**
   * Returns the best applicable discount for a given context.
   * Checks all currently active discounts that match the scope and
   * returns the one with the highest calculated discount amount.
   */
  async getBestDiscount(
    subtotal: number,
    context: {
      customerId: number | undefined | null;
      productId: number | undefined | null;
      categoryId: number | undefined | null;
    },
  ): Promise<DiscountCalculationResult | null> {
    const now = new Date();

    // Build scope conditions
    const scopeConditions: DiscountScope[] = ["GLOBAL"];
    if (context.customerId) scopeConditions.push("CUSTOMER");
    if (context.productId) scopeConditions.push("PRODUCT");
    if (context.categoryId) scopeConditions.push("CATEGORY");

    const discounts = await this.prisma.discount.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        scope: { in: scopeConditions },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        AND: [
          {
            OR: [{ maxUses: null }, { usedCount: { lt: this.prisma.discount.fields.maxUses } }],
          },
        ],
      },
    });

    if (discounts.length === 0) return null;

    let bestResult: DiscountCalculationResult | null = null;
    let bestAmount = new Prisma.Decimal(0);

    for (const discount of discounts) {
      try {
        const result = await this.calculateDiscount({
          discountId: discount.id,
          subtotal,
          ...context,
        });

        const amount = new Prisma.Decimal(result.discountAmount);
        if (amount.gt(bestAmount)) {
          bestAmount = amount;
          bestResult = result;
        }
      } catch {
        // Skip discounts that fail validation (scope mismatch, etc.)
        continue;
      }
    }

    return bestResult;
  }

  // ─── Private Helpers ───────────────────────────────────────────

  private validateScope(scope: DiscountScope, dto: CalculateDiscountDto): void {
    switch (scope) {
      case "PRODUCT":
        if (!dto.productId) {
          throw new BadRequestException("productId is required when applying a PRODUCT-scoped discount");
        }
        break;
      case "CATEGORY":
        if (!dto.categoryId) {
          throw new BadRequestException("categoryId is required when applying a CATEGORY-scoped discount");
        }
        break;
      case "CUSTOMER":
        if (!dto.customerId) {
          throw new BadRequestException("customerId is required when applying a CUSTOMER-scoped discount");
        }
        break;
      case "GLOBAL":
        // No additional context needed
        break;
    }
  }
}

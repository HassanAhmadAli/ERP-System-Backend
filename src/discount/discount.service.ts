import { Injectable, BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, DiscountType, DiscountScope, Discount } from "@/prisma/client";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { CalculateDiscountDto } from "./dto/calculate-discount.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

export interface DiscountCalculationResult {
  discountId: number;
  discountName: string;
  discountNameAr: string | null;
  type: DiscountType;
  scope: DiscountScope;
  subtotal: string;
  discountAmount: number;
  total: number;
}

@Injectable()
export class DiscountService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  // --- CRUD ------------------------------------------------------

  async create(userId: number, createDiscountDto: CreateDiscountDto) {
    if (createDiscountDto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: createDiscountDto.productId },
      });
      if (!product) {
        throw new BadRequestException(
          this.i18n.t("errors.discount.productNotExist", {
            args: { id: createDiscountDto.productId },
          }),
        );
      }
    }

    if (createDiscountDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createDiscountDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          this.i18n.t("errors.discount.categoryNotExist", {
            args: { id: createDiscountDto.categoryId },
          }),
        );
      }
    }

    if (createDiscountDto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: createDiscountDto.customerId },
      });
      if (!customer) {
        throw new BadRequestException(
          this.i18n.t("errors.discount.customerNotExist", {
            args: { id: createDiscountDto.customerId },
          }),
        );
      }
    }

    if (createDiscountDto.type === "PERCENTAGE" && new Prisma.Decimal(createDiscountDto.value).gt(100)) {
      throw new BadRequestException(this.i18n.t("errors.discount.percentageExceeds100"));
    }

    const discount = await this.prisma.discount.create({
      data: {
        ...createDiscountDto,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
    });

    return discount;
  }

  async findAll(query: PaginationQueryDto, search?: string) {
    const where: Prisma.DiscountWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameAr: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, count] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.discount.count({ where }),
    ]);

    return paginated(data, count, query.limit, query.offset);
  }

  async findOne(id: number) {
    const discount = await this.prisma.discount.findUniqueOrThrow({
      where: { id },
      include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
    });

    return discount;
  }

  async update(id: number, updateDiscountDto: UpdateDiscountDto) {
    const current = await this.prisma.discount.findUniqueOrThrow({ where: { id } });
    if (updateDiscountDto.productId) {
      await this.prisma.product.findUniqueOrThrow({
        where: { id: updateDiscountDto.productId },
      });
    }
    if (updateDiscountDto.categoryId) {
      await this.prisma.category.findUniqueOrThrow({
        where: { id: updateDiscountDto.categoryId },
      });
    }
    let finalScope = current.scope;
    if (updateDiscountDto.scope != undefined) {
      finalScope = updateDiscountDto.scope;
    }
    let finalProductId = current.productId;
    if (updateDiscountDto.productId != undefined) {
      finalProductId = updateDiscountDto.productId;
    }

    let finalCategoryId = current.categoryId;
    if (updateDiscountDto.categoryId != undefined) {
      finalCategoryId = updateDiscountDto.categoryId;
    }

    let finalCustomerId = current.customerId;
    if (updateDiscountDto.customerId != undefined) {
      finalCustomerId = updateDiscountDto.customerId;
    }

    if (finalScope === "PRODUCT") {
      if (finalProductId == undefined) {
        throw new BadRequestException(this.i18n.t("errors.discount.productIdRequired"));
      }
    } else {
      if (finalProductId != undefined) {
        throw new BadRequestException(this.i18n.t("errors.discount.productIdNotAllowed"));
      }
      updateDiscountDto.productId = null;
    }
    if (finalScope === "CATEGORY") {
      if (finalCategoryId == undefined) {
        throw new BadRequestException(this.i18n.t("errors.discount.categoryIdRequired"));
      }
    } else {
      if (finalCategoryId != undefined) {
        throw new BadRequestException(this.i18n.t("errors.discount.categoryIdNotAllowed"));
      }
      updateDiscountDto.categoryId = null;
    }
    if (finalScope === "CUSTOMER") {
      if (finalCustomerId == undefined) {
        throw new BadRequestException(this.i18n.t("errors.discount.customerIdRequired"));
      }
    } else {
      if (finalCustomerId != undefined) {
        throw new BadRequestException(this.i18n.t("errors.discount.customerIdNotAllowed"));
      }
      updateDiscountDto.customerId = null;
    }

    let finalType = current.type;
    if (updateDiscountDto.type != undefined) {
      finalType = updateDiscountDto.type;
    }

    let finalValue = current.value;
    if (updateDiscountDto.value != undefined) {
      finalValue = updateDiscountDto.value;
    }

    if (finalType === "PERCENTAGE" && new Prisma.Decimal(finalValue).gt(100)) {
      throw new BadRequestException(this.i18n.t("errors.discount.percentageExceeds100"));
    }

    let finalStartDate = current.startDate;
    if (updateDiscountDto.startDate != undefined) {
      finalStartDate = updateDiscountDto.startDate;
    }

    let finalEndDate = current.endDate;
    if (updateDiscountDto.endDate !== undefined) {
      finalEndDate = updateDiscountDto.endDate;
    }

    if (finalEndDate && finalStartDate >= finalEndDate) {
      throw new BadRequestException(this.i18n.t("errors.discount.endDateAfterStart"));
    }

    const updated = await this.prisma.discount.update({
      where: { id },
      data: updateDiscountDto,
      include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
    });

    return updated;
  }

  async remove(id: number) {
    await this.prisma.discount.delete({ where: { id } });

    return { message: this.i18n.t("responses.discount.deleted", { args: { id } }) };
  }

  async toggleActive(id: number, isActive: boolean) {
    return await this.prisma.discount.update({
      where: { id },
      data: { isActive },
      include: { createdBy: { select: { id: true, fullName: true, fullNameAr: true } } },
    });
  }

  // --- Active / Valid Discounts ----------------------------------

  async getActiveDiscounts(query: PaginationQueryDto, customerId?: number) {
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

    if (customerId != undefined) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [{ scope: { not: DiscountScope.CUSTOMER } }, { scope: DiscountScope.CUSTOMER, customerId }],
        },
      ];
    } else {
      where.scope = { not: DiscountScope.CUSTOMER };
    }

    const [data, total] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.discount.count({ where }),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }

  // --- Discount Calculation Engine -------------------------------

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
      throw new BadRequestException(this.i18n.t("errors.discount.notActive"));
    }

    // 2. Validate date range
    const now = new Date();
    if (discount.startDate > now) {
      throw new BadRequestException(this.i18n.t("errors.discount.notStarted"));
    }
    if (discount.endDate && discount.endDate < now) {
      throw new BadRequestException(this.i18n.t("errors.discount.expired"));
    }

    // 3. Validate usage limit
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException(this.i18n.t("errors.discount.maxUsesReached"));
    }

    // 4. Validate scope requirements
    this.validateScope(discount, dto);

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
      discountNameAr: discount.nameAr,
      type: discount.type,
      scope: discount.scope,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toNumber(),
      total: total.toNumber(),
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
      throw new BadRequestException(this.i18n.t("errors.discount.maxUsesReached"));
    }

    return this.prisma.discount.update({
      where: { id: discountId },
      data: { usedCount: { increment: 1 } },
    });
  }

  /**
   * Validates that a discount can be used without incrementing usage count.
   * Used before finalizing an invoice to ensure the discount is still valid.
   */
  async validateDiscountUsable(discountId: number): Promise<void> {
    const discount = await this.prisma.discount.findUniqueOrThrow({
      where: { id: discountId },
    });

    // 1. Validate discount is active
    if (!discount.isActive) {
      throw new BadRequestException(this.i18n.t("errors.discount.notActive"));
    }

    // 2. Validate date range
    const now = new Date();
    if (discount.startDate > now) {
      throw new BadRequestException(this.i18n.t("errors.discount.notStarted"));
    }
    if (discount.endDate && discount.endDate < now) {
      throw new BadRequestException(this.i18n.t("errors.discount.expired"));
    }

    // 3. Validate usage limit
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException(this.i18n.t("errors.discount.maxUsesReached"));
    }
  }

  /**
   * Returns the best applicable discount for a given context.
   * Checks all currently active discounts that match the scope and
   * returns the one with the highest calculated discount amount.
   */
  async getBestDiscount(
    subtotal: Prisma.Decimal,
    context: {
      customerId: number | undefined | null;
      productId: number | undefined | null;
      categoryId: number | undefined | null;
    },
  ): Promise<DiscountCalculationResult | null> {
    const now = new Date();

    const scopeConditions: Prisma.DiscountWhereInput[] = [{ scope: DiscountScope.GLOBAL }];
    if (context.productId) {
      scopeConditions.push({
        scope: DiscountScope.PRODUCT,
        productId: context.productId,
      });
    }
    if (context.categoryId) {
      scopeConditions.push({
        scope: DiscountScope.CATEGORY,
        categoryId: context.categoryId,
      });
    }
    if (context.customerId) {
      scopeConditions.push({
        scope: DiscountScope.CUSTOMER,
        customerId: context.customerId,
      });
    }
    const where: Prisma.DiscountWhereInput = {
      isActive: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
      AND: [
        {
          OR: [{ maxUses: null }, { usedCount: { lt: this.prisma.discount.fields.maxUses } }],
        },
        {
          OR: scopeConditions,
        },
      ],
    };

    const discounts = await this.prisma.discount.findMany({ where });

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

  // --- Public Helpers -------------------------------------------
  public async calculateOrderDiscount({
    discountId,
    customerId,
    items: items,
  }: {
    discountId: number | undefined | null;
    customerId?: number | null;
    items: {
      productId: number;
      quantity: number;
    }[];
  }): Promise<Prisma.Decimal> {
    if (discountId == undefined) {
      return new Prisma.Decimal(0);
    }
    const discount = await this.prisma.discount.findUniqueOrThrow({
      where: { id: discountId },
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((x) => x.productId) } },
    });
    let matchingItems = items;
    if (discount.scope === DiscountScope.PRODUCT) {
      if (discount.productId == null) {
        throw new UnprocessableEntityException(this.i18n.t("errors.discount.noProductIdSaved"));
      }
      matchingItems = items.filter((item) => item.productId === discount.productId);
      if (matchingItems.length === 0) {
        throw new BadRequestException(this.i18n.t("errors.discount.requiredProductNotInOrder"));
      }
    } else if (discount.scope === DiscountScope.CATEGORY) {
      matchingItems = items.filter((item) => {
        const product = products.find((x) => x.id === item.productId);
        return product?.categoryId === discount.categoryId;
      });
      if (matchingItems.length === 0) {
        throw new BadRequestException(this.i18n.t("errors.discount.requiredCategoryNotInOrder"));
      }
    }
    const subtotal = matchingItems.reduce((sum, item) => {
      const product = products.find((x) => x.id === item.productId)!;
      return sum.add(product.sellingPrice.mul(item.quantity));
    }, new Prisma.Decimal(0));

    const { discountAmount } = await this.calculateDiscount({
      discountId: discount.id,
      subtotal,
      productId: discount.productId,
      categoryId: discount.categoryId,
      customerId: customerId ?? discount.customerId,
    });

    return new Prisma.Decimal(discountAmount);
  }
  // --- Private Helpers -------------------------------------------

  private validateScope(discount: Discount, dto: CalculateDiscountDto): void {
    switch (discount.scope) {
      case DiscountScope.PRODUCT:
        if (!dto.productId) {
          throw new BadRequestException(this.i18n.t("errors.discount.productIdRequiredApply"));
        }
        if (discount.productId !== null && discount.productId !== dto.productId) {
          throw new BadRequestException(this.i18n.t("errors.discount.notApplicableToProduct"));
        }
        break;
      case DiscountScope.CATEGORY:
        if (!dto.categoryId) {
          throw new BadRequestException(this.i18n.t("errors.discount.categoryIdRequiredApply"));
        }
        if (discount.categoryId != null && discount.categoryId !== dto.categoryId) {
          throw new BadRequestException(this.i18n.t("errors.discount.notApplicableToCategory"));
        }
        break;
      case DiscountScope.GLOBAL:
        // No additional context needed
        break;
      case DiscountScope.CUSTOMER:
        if (!dto.customerId) {
          throw new BadRequestException(this.i18n.t("errors.discount.customerIdRequiredApply"));
        }
        if (discount.customerId != null && discount.customerId !== dto.customerId) {
          throw new BadRequestException(this.i18n.t("errors.discount.notApplicableToCustomer"));
        }
        break;
    }
  }
}

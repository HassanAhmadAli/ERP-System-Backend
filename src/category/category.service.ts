import { Injectable, ConflictException, BadRequestException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

import { PrismaService } from "@/prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";

@Injectable()
export class CategoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      select: { id: true },
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t("errors.category.nameExists", { args: { name: createCategoryDto.name } }),
      );
    }

    if (createCategoryDto.nameAr) {
      const nameArConflict = await this.prisma.category.findFirst({
        select: { id: true },
        where: { nameAr: createCategoryDto.nameAr },
      });
      if (nameArConflict) {
        throw new ConflictException(
          this.i18n.t("errors.category.nameExists", { args: { name: createCategoryDto.nameAr } }),
        );
      }
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll(query: PaginationQueryDto, search: string | undefined) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { nameAr: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.category.count({ where }),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUniqueOrThrow({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            barcode: true,
            sellingPrice: true,
            quantityInStock: true,
          },
          take: 10,
          orderBy: { name: "asc" },
        },
        _count: { select: { products: true } },
      },
    });

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.prisma.category.findUniqueOrThrow({ where: { id } });

    if (updateCategoryDto.name) {
      const nameConflict = await this.prisma.category.findFirst({
        select: { id: true },
        where: { name: updateCategoryDto.name, NOT: { id } },
      });
      if (nameConflict) {
        throw new ConflictException(
          this.i18n.t("errors.category.nameExists", { args: { name: updateCategoryDto.name } }),
        );
      }
    }

    if (updateCategoryDto.nameAr) {
      const nameArConflict = await this.prisma.category.findFirst({
        select: { id: true },
        where: { nameAr: updateCategoryDto.nameAr, NOT: { id } },
      });
      if (nameArConflict) {
        throw new ConflictException(
          this.i18n.t("errors.category.nameExists", { args: { name: updateCategoryDto.nameAr } }),
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async remove(id: number) {
    await this.prisma.category.findUniqueOrThrow({ where: { id } });

    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        this.i18n.t("errors.category.cannotDeleteWithProducts", {
          args: { count: productCount },
        }),
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: this.i18n.t("responses.category.deleted", { args: { id } }) };
  }
}

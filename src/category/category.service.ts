import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      select: { id: true },
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(`Category with name "${createCategoryDto.name}" already exists`);
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll(paginationQuery: PaginationQueryDto, search: string | undefined) {
    const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip: paginationQuery.offset,
        take: paginationQuery.limit,
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUniqueOrThrow({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
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
        throw new ConflictException(`Category with name "${updateCategoryDto.name}" already exists`);
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
        `Cannot delete category that has ${productCount} associated product(s). Reassign or remove them first.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: `Category with ID ${id} has been deleted successfully` };
  }
}

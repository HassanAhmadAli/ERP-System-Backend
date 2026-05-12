import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Prisma } from "@/prisma";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(createProductDto: CreateProductDto) {
    // Verify category and supplierexists
    console.log("ok");
    const [_category, _supplier, existingProduct] = await Promise.all([
      this.prisma.category.findUniqueOrThrow({
        select: { id: true },
        where: { id: createProductDto.categoryId },
      }),
      this.prisma.supplier.findUniqueOrThrow({
        select: { id: true },
        where: { id: createProductDto.supplierId },
      }),
      this.prisma.product.findFirst({
        select: { id: true },
        where: { barcode: createProductDto.barcode },
      }),
    ]);

    // Check for duplicate barcode
    if (existingProduct) {
      throw new ConflictException(`Product with barcode ${createProductDto.barcode} already exists`);
    }

    const product = await this.prisma.product.create({
      data: createProductDto,
      include: {
        category: true,
        supplier: true,
      },
    });
    return product;
  }

  async getProducts(paginationQuery: PaginationQueryDto, search: string | undefined) {
    const where: Prisma.ProductWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const data = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      skip: paginationQuery.offset,
      take: paginationQuery.limit,
      orderBy: { createdAt: "desc" },
    });

    return { data };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        supplier: true,
        saleItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            invoice: {
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
          take: 10,
          orderBy: { invoice: { createdAt: "desc" } },
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
          },
          take: 10,
        },
      },
    });

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // Verify product exists
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id },
    });

    // If barcode is being updated, check for duplicates
    if (updateProductDto.barcode && updateProductDto.barcode !== product.barcode) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { barcode: updateProductDto.barcode },
      });
      if (existingProduct) {
        throw new ConflictException(`Product with barcode ${updateProductDto.barcode} already exists`);
      }
    }

    // Verify category exists if being updated
    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId) {
      await this.prisma.category.findUniqueOrThrow({
        select: { id: true },
        where: { id: updateProductDto.categoryId },
      });
    }

    // Verify supplier exists if being updated
    if (updateProductDto.supplierId && updateProductDto.supplierId !== product.supplierId) {
      await this.prisma.supplier.findUniqueOrThrow({
        select: { id: true },
        where: { id: updateProductDto.supplierId },
      });
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        supplier: true,
      },
    });

    return updatedProduct;
  }

  async remove(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if product has been sold or is in orders
    const saleItems = await this.prisma.saleItem.count({
      where: { productId: id },
    });

    const orderItems = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (saleItems > 0 || orderItems > 0) {
      throw new BadRequestException("Cannot delete product that has been sold or is in active orders");
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: `Product with ID ${id} has been deleted successfully` };
  }

  async getProductsByCategory(categoryId: number, paginationQuery: PaginationQueryDto) {
    const _category = await this.prisma.category.findUniqueOrThrow({
      where: { id: categoryId },
    });

    const data = await this.prisma.product.findMany({
      where: { categoryId },
      include: {
        category: true,
        supplier: true,
      },
      skip: paginationQuery.offset,
      take: paginationQuery.limit,
      orderBy: { createdAt: "desc" },
    });

    return {
      data,
    };
  }

  async getProductsBySupplier(supplierId: number, paginationQuery: PaginationQueryDto) {
    const _supplier = await this.prisma.supplier.findUniqueOrThrow({
      where: { id: supplierId },
    });

    const data = await this.prisma.product.findMany({
      where: { supplierId },
      include: {
        category: true,
        supplier: true,
      },
      skip: paginationQuery.offset,
      take: paginationQuery.limit,
      orderBy: { createdAt: "desc" },
    });

    return {
      data,
    };
  }

  async getLowStockProducts(paginationQuery: PaginationQueryDto) {
    const data = await this.prisma.product.findMany({
      where: {
        quantityInStock: {
          lte: this.prisma.product.fields.minQuantity,
        },
      },
      include: {
        category: true,
        supplier: true,
      },
      skip: paginationQuery.offset,
      take: paginationQuery.limit,
      orderBy: { quantityInStock: "asc" },
    });

    return { data };
  }

  async updateStock(id: number, quantityInStock: number) {
    const _product = await this.prisma.product.findUniqueOrThrow({
      where: { id },
    });

    return this.prisma.product.update({
      where: { id },
      data: {
        quantityInStock: quantityInStock,
      },
      include: {
        category: true,
        supplier: true,
      },
    });
  }
}

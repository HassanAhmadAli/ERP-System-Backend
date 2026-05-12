import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

@Injectable()
export class SupplierService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(createSupplierDto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll(paginationQuery: PaginationQueryDto, search: string | undefined) {
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: paginationQuery.offset,
        take: paginationQuery.limit,
        include: {
          _count: { select: { products: true, purchaseInvoices: true } },
        },
        orderBy: { fullName: "asc" },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUniqueOrThrow({
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
        purchaseInvoices: {
          select: {
            id: true,
            total: true,
            status: true,
            invoiceDate: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { products: true, purchaseInvoices: true } },
      },
    });

    return supplier;
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    await this.prisma.supplier.findUniqueOrThrow({ where: { id } });

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
      include: {
        _count: { select: { products: true, purchaseInvoices: true } },
      },
    });
  }

  async remove(id: number) {
    await this.prisma.supplier.findUniqueOrThrow({ where: { id } });

    const productCount = await this.prisma.product.count({
      where: { supplierId: id },
    });

    const invoiceCount = await this.prisma.purchaseInvoice.count({
      where: { supplierId: id },
    });

    if (productCount > 0 || invoiceCount > 0) {
      throw new BadRequestException(
        `Cannot delete supplier that has ${productCount} product(s) and ${invoiceCount} purchase invoice(s) associated. Reassign or remove them first.`,
      );
    }

    await this.prisma.supplier.delete({ where: { id } });

    return { message: `Supplier with ID ${id} has been deleted successfully` };
  }
}

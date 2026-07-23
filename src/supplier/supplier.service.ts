import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";

@Injectable()
export class SupplierService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async create(createSupplierDto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll(query: PaginationQueryDto, search: string | undefined) {
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
        skip: query.offset,
        take: query.limit,
        include: {
          _count: { select: { products: true, purchaseInvoices: true } },
        },
        orderBy: { fullName: "asc" },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return paginated(data, total, query.limit, query.offset);
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
        this.i18n.t("errors.supplier.cannotDeleteWithAssociations", {
          args: { productCount, invoiceCount },
        }),
      );
    }

    await this.prisma.supplier.delete({ where: { id } });

    return { message: this.i18n.t("responses.supplier.deleted", { args: { id } }) };
  }
}

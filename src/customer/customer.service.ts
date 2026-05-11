import { PrismaService } from "@/prisma";
import { Injectable } from "@nestjs/common";
import { UpdateCustomerProfileDto } from "./dto/update-profile.dto";
import { GetProductsDto } from "./dto/get-products.dto";
import { Prisma } from "@/prisma/generated/prisma-client/browser";

@Injectable()
export class CustomerService {
  constructor(private prismaService: PrismaService) {}
  get prisma() {
    return this.prismaService.client;
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
        email: true,
        phoneNumber: true,
        customer: {
          select: {
            address: true,
            loyaltyPoints: true,
            totalSpent: true,
          },
        },
      },
    });
    return user;
  }

  async updateProfile(userId: number, dto: UpdateCustomerProfileDto) {
    const { address, ...userFields } = dto;
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...userFields,
        customer: {
          update: {
            where: { userId },
            data: { address },
          },
        },
      },
      select: {
        fullName: true,
        email: true,
        phoneNumber: true,
        customer: {
          select: {
            address: true,
          },
        },
      },
    });
    return user;
  }

  async getProducts(dto: GetProductsDto) {
    const { search, categoryId, page, limit } = dto;

    const where: Prisma.ProductWhereInput = {
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          sellingPrice: true,
          imageUrl: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

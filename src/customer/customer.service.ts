import { PrismaService } from "@/prisma";
import { Injectable } from "@nestjs/common";
import { UpdateCustomerProfileDto } from "./dto/update-profile.dto";

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
          where: { userId },
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
          where: { userId },
          select: {
            address: true,
          },
        },
      },
    });
    return user;
  }
}

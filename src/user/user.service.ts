import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService, UserRole } from "@/prisma";
import { Public } from "@/common/decorators/public.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { getEntriesOfTrue } from "@/utils";
import { HashingService } from "@/hashing/hashing.service";
import { AppCachingService } from "@/caching/caching.service";

@Public()
@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly cachingService: AppCachingService,
  ) {}
  get prisma() {
    return this.prismaService.client;
  }
  async updateAdminProfile(updateUserDto: UpdateProfileDto, userId: number) {
    const res = await this.prisma.user.update({
      where: {
        id: userId,
        role: UserRole.ADMIN,
      },
      data: updateUserDto,
      select: {
        ...getEntriesOfTrue(updateUserDto),
        phoneNumber: true,
        email: true,
        passwordHash: false,
      } satisfies Prisma.UserSelect,
    });
    await this.cachingService.users.removeCachedUserData(userId);
    return res;
  }
  async getProfile(userId: number) {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        fullName: true,
        email: true,
        phoneNumber: true,
        nationalId: true,
        role: true,
      },
    });
  }
  async updateEmployeeProfile(updateUserDto: UpdateProfileDto, userId: number) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
        role: UserRole.EMPLOYEE,
      },
      data: updateUserDto,
      select: {
        ...getEntriesOfTrue(updateUserDto),
        email: true,
        phoneNumber: true,
      } satisfies Prisma.UserSelect,
    });
    return user;
  }

  async archiveAccount(userId: number) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
  async deleteAccount(userId: number) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

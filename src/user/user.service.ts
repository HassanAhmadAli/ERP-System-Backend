import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService, UserRole } from "@/prisma";
import { Public } from "@/common/decorators/public.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { getEntriesOfTrue } from "@/utils";
import { HashingService } from "@/hashing/hashing.service";
import { AppCachingService } from "@/caching/caching.service";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

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
    console.log({ userId, updateUserDto });
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
  async viewUsersProfiles(query: PaginationQueryDto, role: UserRole | undefined) {
    // We use findMany with the transformed DTO values
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: role, // Prisma ignores this if it's undefined
          deletedAt: query.deletedAt,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true,
          deletedAt: query.deleted,
        },
        take: query.limit,
        skip: query.offset,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.user.count({
        where: {
          role: role,
          deletedAt: query.deletedAt,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  }
}

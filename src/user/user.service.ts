import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, UserRole } from "@/prisma/client";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AppCachingService } from "@/caching/caching.service";
import { deletedAt, PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { AuthenticationService } from "@/authentication/authentication.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateLanguageDto } from "./dto/update-language.dto";

const STAFF_ROLES: UserRole[] = [UserRole.CASHIER, UserRole.ACCOUNTANT, UserRole.WAREHOUSE_WORKER];
const staff_profile_select = {
  fullName: true,
  fullNameAr: true,
  role: true,
  nationalId: true,
  phoneNumber: true,
  email: true,
  language: true,
} satisfies Prisma.UserSelect;
@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cachingService: AppCachingService,
    private readonly authenticationService: AuthenticationService,
  ) {}
  get prisma() {
    return this.prismaService.client;
  }

  async updatePersonalProfile(updateUserDto: UpdateProfileDto, userId: number) {
    const res = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: staff_profile_select,
    });
    await this.cachingService.users.removeCachedUserData(userId);
    return res;
  }

  async updatePersonalLanguage({ language }: UpdateLanguageDto, userId: number) {
    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: { language },
      }),
      this.cachingService.users.removeCachedUserData(userId),
    ]);
    return;
  }

  async createStaff(dto: CreateStaffDto) {
    return await this.authenticationService.createVerifiedStaff(dto);
  }

  async updateStoreManagerProfile(updateUserDto: UpdateProfileDto, userId: number) {
    const res = await this.prisma.user.update({
      where: {
        id: userId,
        role: UserRole.STORE_MANAGER,
      },
      data: updateUserDto,
      select: staff_profile_select,
    });
    await this.cachingService.users.removeCachedUserData(userId);
    return res;
  }

  async getProfile(userId: number) {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: staff_profile_select,
    });
  }

  async updateStaffProfile(updateUserDto: UpdateProfileDto, userId: number) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
        role: { in: STAFF_ROLES },
      },
      data: updateUserDto,
      select: staff_profile_select,
    });
    await this.cachingService.users.removeCachedUserData(userId);
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
    const where = {
      role: role,
      deletedAt: deletedAt(query.deleted),
    } as const;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          ...staff_profile_select,
          id: true,
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
        where,
      }),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }
}

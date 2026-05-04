import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService, UserRole } from "@/prisma";
import { Public } from "@/common/decorators/public.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { getEntriesOfTrue } from "@/utils";
import { HashingService } from "@/hashing/hashing.service";
import { CreateEmployeeDto } from "./dto/create-user.dto";
import { CachingService } from "@/caching/caching.service";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

@Public()
@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly cachingService: CachingService,
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
  async addEmployee({ password: rawPassword, ...createEcmployeeDto }: CreateEmployeeDto) {
    const passwordHash = await this.hashingService.hash({
      raw: rawPassword,
    });
    return await this.prisma.user.create({
      data: {
        ...createEcmployeeDto,
        passwordHash,
        isVerified: true,
      },
      select: {
        email: true,
        phoneNumber: true,
        role: true,
        fullName: true,
        createdAt: true,
      },
    });
  }

  //todo: Promote to Admin
  async promoteToAdmin(employeeId: number) {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id: employeeId,
      },
      select: {
        email: true,
        phoneNumber: true,
        role: true,
      },
    });
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

import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService, Role } from "@/prisma";
import { Public } from "@/common/decorators/public.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { getEntriesOfTrue } from "@/utils";
import { HashingService } from "@/iam/hashing/hashing.service";
import { CreateEmployeeDto } from "./dto/create-user.dto";
import { CachingService } from "@/common/caching/caching.service";
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
        role: {
          in: [Role.Employee, Role.Debugging],
        },
      },
      data: updateUserDto,
      select: {
        ...getEntriesOfTrue(updateUserDto),
        phoneNumber: true,
        email: true,
        password: false,
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
        departmentId: true,
      },
    });
  }
  async updateEmployeeProfile(updateUserDto: UpdateProfileDto, userId: number) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
        role: {
          in: [Role.Employee, Role.Debugging],
        },
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
    const password = await this.hashingService.hash({
      raw: rawPassword,
    });
    return await this.prisma.user.create({
      data: {
        ...createEcmployeeDto,
        password,
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
  async getEmployeesOfDepartment(departmentId: number, { deletedAt, limit, offset }: PaginationQueryDto) {
    return await this.prisma.user.findMany({
      where: {
        departmentId,
        deletedAt,
      },
      skip: offset,
      take: limit,
      omit: {
        password: true,
        deletedAt: true,
      },
    });
  }
}

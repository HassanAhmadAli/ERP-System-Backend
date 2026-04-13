import { ConflictException, Injectable } from "@nestjs/common";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { PrismaService } from "@/prisma";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { logger } from "@/utils";

@Injectable()
export class DepartmentService {
  constructor(private readonly prismaService: PrismaService) {}
  private get prisma() {
    return this.prismaService.client;
  }

  async create(createDepartmentDto: CreateDepartmentDto) {
    return await this.prisma.department.create({
      data: createDepartmentDto,
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  }

  async findAll({ limit, offset, deletedAt, deleted }: PaginationQueryDto) {
    logger.debug({ deleted, deletedAt });
    return await this.prisma.department.findMany({
      where: {
        deletedAt,
      },
      select: {
        id: true,
        name: true,
        description: true,
        deletedAt: deleted,
      },
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: number) {
    return await this.prisma.department.findUniqueOrThrow({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    const res = await this.prisma.department.update({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      data: updateDepartmentDto,
    });
    if (res == undefined) {
      throw new ConflictException("Department Not Found");
    }
    return res;
  }
  async unArchive(id: number) {
    const res = await this.prisma.department.update({
      where: {
        deletedAt: {
          not: null,
        },
        id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        deletedAt: true,
      },
      data: {
        deletedAt: null,
      },
    });
    if (res == undefined) {
      throw new ConflictException("No Deleted Department with this id was found");
    }
    return res;
  }
  async archive(id: number) {
    const res = await this.prisma.department.update({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    if (res == undefined) {
      throw new ConflictException("Department Not Found");
    }
    return res;
  }
  async delete(id: number) {
    const res = await this.prisma.department.delete({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    if (res == undefined) {
      throw new ConflictException("Department Not Found");
    }
    return res;
  }
}

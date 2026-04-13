import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UnauthorizedException,
  UseInterceptors,
} from "@nestjs/common";
import { DepartmentService } from "./department.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { ActiveUser } from "@/iam/decorators/ActiveUser.decorator";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { SetAllowedRoles } from "@/iam/authorization/decorators/roles.decorator";
import { Role } from "@/prisma";
import { CacheInterceptor } from "@nestjs/cache-manager";
@SetAllowedRoles(Role.Admin)
@Controller("department")
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  async create(
    @Body()
    createDepartmentDto: CreateDepartmentDto,
  ) {
    return await this.departmentService.create(createDepartmentDto);
  }

  @UseInterceptors(CacheInterceptor)
  @Get()
  async findAll(@Query() query: PaginationQueryDto, @ActiveUser("role") userRole: Role) {
    if (query.deleted && !(userRole === "Admin" || userRole === "Debugging")) {
      throw new UnauthorizedException("you does not have permissions to see deleted items");
    }
    return await this.departmentService.findAll(query);
  }

  @UseInterceptors(CacheInterceptor)
  @SetAllowedRoles(Role.Citizen, Role.Employee)
  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe)
    id: number,
  ) {
    return await this.departmentService.findOne(id);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe)
    id: number,
    @Body()
    updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return await this.departmentService.update(id, updateDepartmentDto);
  }

  @Patch("archive/:id")
  async reactivateArchived(
    @Param("id", ParseIntPipe)
    id: number,
  ) {
    return await this.departmentService.unArchive(id);
  }

  @Delete("archive/:id")
  async archive(
    @Param("id", ParseIntPipe)
    id: number,
  ) {
    return await this.departmentService.archive(id);
  }

  @Delete("delete/:id")
  async delete(
    @Param("id", ParseIntPipe)
    id: number,
  ) {
    return await this.departmentService.delete(id);
  }
}

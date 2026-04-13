import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ActiveUser } from "@/iam/decorators/ActiveUser.decorator";
import { SetAllowedRoles } from "@/iam/authorization/decorators/roles.decorator";
import { Role } from "@/prisma";
import { CreateEmployeeDto } from "./dto/create-user.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}
  @SetAllowedRoles(Role.Admin, Role.Citizen)
  @Patch("profile")
  updateProfile(
    @Body()
    updateUserDto: UpdateProfileDto,
    @ActiveUser("sub") id: number,
  ) {
    return this.userService.updateAdminProfile(updateUserDto, id);
  }

  @Get("profile")
  getProfile(@ActiveUser("sub") userId: number) {
    return this.userService.getProfile(userId);
  }

  @SetAllowedRoles(Role.Admin)
  @Post("employee")
  async addEmployee(
    @Body()
    createEmployeeDto: CreateEmployeeDto,
  ) {
    return await this.userService.addEmployee(createEmployeeDto);
  }

  @SetAllowedRoles(Role.Admin)
  @Patch("employee/profile/:id")
  async updateEmployeeProfile(
    @Param("id", ParseIntPipe)
    userId: number,
    @Body()
    updateUserDto: UpdateProfileDto,
  ) {
    return await this.userService.updateEmployeeProfile(updateUserDto, userId);
  }

  @SetAllowedRoles(Role.Admin)
  @Patch("employee/promote/:id")
  async promoteToAdmin(
    @Param("id", ParseIntPipe)
    employeeId: number,
  ) {
    return await this.userService.promoteToAdmin(employeeId);
  }

  @SetAllowedRoles(Role.Admin)
  @Delete("archive/:id")
  async archiveAccount(@Param("id") userId: number) {
    return await this.userService.archiveAccount(userId);
  }

  @SetAllowedRoles(Role.Admin)
  @Delete("delete/:id")
  async deleteAccount(@Param("id") userId: number) {
    return await this.userService.deleteAccount(userId);
  }
  @SetAllowedRoles(Role.Admin)
  @Get("department/:id/employees")
  async getEmployeesOfDepartment(
    @Query()
    paginationQueryDto: PaginationQueryDto,
    @Param("id", ParseIntPipe)
    departmentId: number,
  ) {
    return await this.userService.getEmployeesOfDepartment(departmentId, paginationQueryDto);
  }
}

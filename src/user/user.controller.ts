import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ActiveUser } from "@/iam/decorators/ActiveUser.decorator";
import { SetAllowedRoles } from "@/iam/authorization/decorators/roles.decorator";
import { UserRole } from "@/prisma";
import { CreateEmployeeDto } from "./dto/create-user.dto";
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}
  @SetAllowedRoles(UserRole.ADMIN, UserRole.CUSTOMER)
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

  @SetAllowedRoles(UserRole.ADMIN)
  @Post("employee")
  async addEmployee(
    @Body()
    createEmployeeDto: CreateEmployeeDto,
  ) {
    return await this.userService.addEmployee(createEmployeeDto);
  }

  @SetAllowedRoles(UserRole.ADMIN)
  @Patch("employee/profile/:id")
  async updateEmployeeProfile(
    @Param("id", ParseIntPipe)
    userId: number,
    @Body()
    updateUserDto: UpdateProfileDto,
  ) {
    return await this.userService.updateEmployeeProfile(updateUserDto, userId);
  }

  @SetAllowedRoles(UserRole.ADMIN)
  @Patch("employee/promote/:id")
  async promoteToAdmin(
    @Param("id", ParseIntPipe)
    employeeId: number,
  ) {
    return await this.userService.promoteToAdmin(employeeId);
  }

  @SetAllowedRoles(UserRole.ADMIN)
  @Delete("archive/:id")
  async archiveAccount(@Param("id") userId: number) {
    return await this.userService.archiveAccount(userId);
  }

  @SetAllowedRoles(UserRole.ADMIN)
  @Delete("delete/:id")
  async deleteAccount(@Param("id") userId: number) {
    return await this.userService.deleteAccount(userId);
  }
}

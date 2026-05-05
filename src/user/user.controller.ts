import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { OptionalUserRoleSchema } from "@/common/schema/role";
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @setPermissions(Permissions.updateAdminProfile)
  @Patch("admin/me")
  updatePersonalAdminProfile(
    @Body()
    updateUserDto: UpdateProfileDto,
    @ActiveUser("sub") id: number,
  ) {
    return this.userService.updateAdminProfile(updateUserDto, id);
  }

  @Get("me")
  getPersonalProfile(@ActiveUser("sub") userId: number) {
    return this.userService.getProfile(userId);
  }

  @setPermissions(Permissions.updateEmployeeProfile)
  @Patch("employee/profile/:id")
  async updateEmployeeProfile(
    @Param("id", ParseIntPipe)
    userId: number,
    @Body()
    updateUserDto: UpdateProfileDto,
  ) {
    return await this.userService.updateEmployeeProfile(updateUserDto, userId);
  }

  @setPermissions(Permissions.archiveAccount)
  @Delete("archive/:id")
  async archiveAccount(@Param("id", ParseIntPipe) userId: number) {
    return await this.userService.archiveAccount(userId);
  }

  @setPermissions(Permissions.deleteAccount)
  @Delete("delete/:id")
  async deleteAccount(@Param("id", ParseIntPipe) userId: number) {
    return await this.userService.deleteAccount(userId);
  }

  @setPermissions(Permissions.viewUsersProfiles)
  @Get()
  async viewUsersProfiles(@Query() query: PaginationQueryDto, @Query("role") _role: string | undefined) {
    const role = OptionalUserRoleSchema.parse(_role);
    return await this.userService.viewUsersProfiles(query, role);
  }
}

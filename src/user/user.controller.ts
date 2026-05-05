import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch } from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}
  // @SetAllowedRoles(UserRole.ADMIN, UserRole.CUSTOMER)
  @setPermissions(Permissions.updatePersonalProfile)
  @Patch("profile")
  updateProfile(
    @Body()
    updateUserDto: UpdateProfileDto,
    @ActiveUser("sub") id: number,
  ) {
    return this.userService.updateAdminProfile(updateUserDto, id);
  }

  @Get("me/profile")
  getPersonalProfile(@ActiveUser("sub") userId: number) {
    console.log({ sub: userId });
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
  async archiveAccount(@Param("id") userId: number) {
    return await this.userService.archiveAccount(userId);
  }

  @setPermissions(Permissions.deleteAccount)
  @Delete("delete/:id")
  async deleteAccount(@Param("id") userId: number) {
    return await this.userService.deleteAccount(userId);
  }
}

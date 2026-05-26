import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { OptionalUserRoleSchema } from "@/common/schema/role";
import { viewUsersProfilesQueryDto } from "./dto/view-users-profiles-query.dto";
import { CreateStaffDto } from "./dto/create-staff.dto";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @setPermissions(Permissions.manageEmployees)
  @Post("staff")
  async createStaff(@Body() createStaffDto: CreateStaffDto) {
    return await this.userService.createStaff(createStaffDto);
  }

  @setPermissions(Permissions.updateStoreManagerProfile)
  @Patch("store-manager/me")
  updateStoreManagerProfile(
    @Body()
    updateUserDto: UpdateProfileDto,
    @ActiveUser("sub") id: number,
  ) {
    return this.userService.updateStoreManagerProfile(updateUserDto, id);
  }

  @Get("me")
  getPersonalProfile(@ActiveUser("sub") userId: number) {
    return this.userService.getProfile(userId);
  }

  @setPermissions(Permissions.manageEmployees)
  @Patch("staff/profile/:id")
  async updateStaffProfile(
    @Param("id", ParseIntPipe)
    userId: number,
    @Body()
    updateUserDto: UpdateProfileDto,
  ) {
    return await this.userService.updateStaffProfile(updateUserDto, userId);
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

  @setPermissions(Permissions.viewUsersProfiles, Permissions.manageEmployees)
  @Get()
  async viewUsersProfiles(@Query() { role: _role, ...query }: viewUsersProfilesQueryDto) {
    const role = OptionalUserRoleSchema.parse(_role);
    return await this.userService.viewUsersProfiles(query, role);
  }
}

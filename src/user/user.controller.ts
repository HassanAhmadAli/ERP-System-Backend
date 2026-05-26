import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { OptionalUserRoleSchema } from "@/common/schema/role";
import { viewUsersProfilesQueryDto } from "./dto/view-users-profiles-query.dto";
import { CreateStaffDto } from "./dto/create-staff.dto";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";
import { MessageResponseDto } from "@/openapi/dto/responses.dto";

@ApiTags("Users")
@ApiAuth()
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @setPermissions(Permissions.manageEmployees)
  @Post("staff")
  @DocumentOperation("Create staff member", "Store manager creates cashier, accountant, or warehouse worker.")
  @DocumentBody(CreateStaffDto)
  @DocumentCreatedResponse("Staff account created")
  async createStaff(@Body() createStaffDto: CreateStaffDto) {
    return await this.userService.createStaff(createStaffDto);
  }

  @setPermissions(Permissions.updateStoreManagerProfile)
  @Patch("store-manager/me")
  @DocumentOperation("Update store manager profile")
  @DocumentBody(UpdateProfileDto)
  @DocumentOkResponse("Profile updated")
  updateStoreManagerProfile(@Body() updateUserDto: UpdateProfileDto, @ActiveUser("sub") id: number) {
    return this.userService.updateStoreManagerProfile(updateUserDto, id);
  }

  @Get("me")
  @DocumentOperation("Get current user profile")
  @DocumentOkResponse("Authenticated user profile")
  getPersonalProfile(@ActiveUser("sub") userId: number) {
    return this.userService.getProfile(userId);
  }

  @setPermissions(Permissions.manageEmployees)
  @Patch("staff/profile/:id")
  @DocumentOperation("Update staff profile")
  @DocumentParam("id", "Staff user ID")
  @DocumentBody(UpdateProfileDto)
  @DocumentOkResponse("Staff profile updated")
  async updateStaffProfile(@Param("id", ParseIntPipe) userId: number, @Body() updateUserDto: UpdateProfileDto) {
    return await this.userService.updateStaffProfile(updateUserDto, userId);
  }

  @setPermissions(Permissions.archiveAccount)
  @Delete("archive/:id")
  @DocumentOperation("Archive user account", "Soft-delete; account can be restored from backups.")
  @DocumentParam("id", "User ID")
  @DocumentOkResponse("Account archived", MessageResponseDto)
  async archiveAccount(@Param("id", ParseIntPipe) userId: number) {
    return await this.userService.archiveAccount(userId);
  }

  @setPermissions(Permissions.deleteAccount)
  @Delete("delete/:id")
  @DocumentOperation("Permanently delete user account")
  @DocumentParam("id", "User ID")
  @DocumentOkResponse("Account deleted", MessageResponseDto)
  async deleteAccount(@Param("id", ParseIntPipe) userId: number) {
    return await this.userService.deleteAccount(userId);
  }

  @setPermissions(Permissions.viewUsersProfiles, Permissions.manageEmployees)
  @Get()
  @DocumentOperation("List user profiles", "Filter staff by role; paginated.")
  @DocumentOkResponse("Paginated user list")
  async viewUsersProfiles(@Query() { role: _role, ...query }: viewUsersProfilesQueryDto) {
    const role = OptionalUserRoleSchema.parse(_role);
    return await this.userService.viewUsersProfiles(query, role);
  }
}

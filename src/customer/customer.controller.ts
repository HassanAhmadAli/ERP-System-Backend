import { Body, Controller, Get, Patch } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { UpdateCustomerProfileDto } from "./dto/update-profile.dto";

@Controller("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @setPermissions(Permissions.viewCustomerProfile)
  @Get("me")
  getProfile(@ActiveUser("sub") userId: number) {
    return this.customerService.getProfile(userId);
  }

  @setPermissions(Permissions.updatePersonalProfile)
  @Patch("me")
  updateProfile(@ActiveUser("sub") userId: number, @Body() dto: UpdateCustomerProfileDto) {
    return this.customerService.updateProfile(userId, dto);
  }
}

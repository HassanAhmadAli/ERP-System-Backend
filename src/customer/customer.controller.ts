import { Body, Controller, Get, Patch, Query } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { UpdateCustomerProfileDto } from "./dto/update-profile.dto";
import { dot } from "node:test/reporters";
import { GetProductsDto } from "./dto/get-products.dto";

@Controller("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @setPermissions(Permissions.viewCustomerProfile)
  @Get("profile")
  getProfile(@ActiveUser("sub") userId: number) {
    return this.customerService.getProfile(userId);
  }

  @setPermissions(Permissions.updatePersonalProfile)
  @Patch("profile")
  updateProfile(@ActiveUser("sub") userId: number, @Body() dto: UpdateCustomerProfileDto) {
    return this.customerService.updateProfile(userId, dto);
  }

  @Get("products")
  getProducts(@Query() dot: GetProductsDto) {
    return this.customerService.getProducts(dot);
  }
}

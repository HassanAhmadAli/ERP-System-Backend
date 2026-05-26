import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CustomerService } from "./customer.service";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { UpdateCustomerProfileDto } from "./dto/update-profile.dto";
import { CustomerListQueryDto } from "./dto/customer-list-query.dto";
import { AdjustCustomerLoyaltyDto } from "./dto/adjust-customer-loyalty.dto";
import { UpdateCustomerStatusDto } from "./dto/update-customer-status.dto";
import { ApiAuth, DocumentBody, DocumentOkResponse, DocumentOperation, DocumentParam } from "@/openapi/decorators";

@ApiTags("Customer")
@ApiAuth()
@Controller("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @setPermissions(Permissions.viewCustomerProfile)
  @Get("me")
  @DocumentOperation("Get current customer profile", "Includes loyalty points and address.")
  @DocumentOkResponse("Customer profile")
  getProfile(@ActiveUser("sub") userId: number) {
    return this.customerService.getProfile(userId);
  }

  @setPermissions(Permissions.updateCustomerPersonalProfile)
  @Patch("me")
  @DocumentOperation("Update current customer profile")
  @DocumentBody(UpdateCustomerProfileDto)
  @DocumentOkResponse("Profile updated")
  updateProfile(@ActiveUser("sub") userId: number, @Body() dto: UpdateCustomerProfileDto) {
    return this.customerService.updateProfile(userId, dto);
  }

  @setPermissions(Permissions.viewCustomers)
  @Get()
  @DocumentOperation("List customers (store manager)")
  @DocumentOkResponse("Paginated customers")
  findAll(@Query() query: CustomerListQueryDto) {
    return this.customerService.findAll(query);
  }

  @setPermissions(Permissions.viewCustomers)
  @Get(":id")
  @DocumentOperation("Get customer by ID")
  @DocumentParam("id", "Customer ID")
  @DocumentOkResponse("Customer details")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @setPermissions(Permissions.manageCustomerStatus)
  @Patch(":id/status")
  @DocumentOperation("Enable or disable customer account")
  @DocumentParam("id", "Customer ID")
  @DocumentBody(UpdateCustomerStatusDto)
  @DocumentOkResponse("Customer status updated")
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCustomerStatusDto) {
    return this.customerService.updateStatus(id, dto);
  }

  @setPermissions(Permissions.manageCustomerLoyalty)
  @Patch(":id/loyalty")
  @DocumentOperation("Adjust customer loyalty points")
  @DocumentParam("id", "Customer ID")
  @DocumentBody(AdjustCustomerLoyaltyDto)
  @DocumentOkResponse("Loyalty points updated")
  adjustLoyalty(
    @Param("id", ParseIntPipe) id: number,
    @ActiveUser("sub") actorUserId: number,
    @Body() dto: AdjustCustomerLoyaltyDto,
  ) {
    return this.customerService.adjustLoyalty(id, actorUserId, dto);
  }
}

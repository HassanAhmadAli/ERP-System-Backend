import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CustomerService } from "./customer.service";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { UpdateCustomerProfileDto } from "./dto/update-profile.dto";
import { CustomerListQueryDto } from "./dto/customer-list-query.dto";
import { AdjustCustomerLoyaltyDto } from "./dto/adjust-customer-loyalty.dto";
import { UpdateCustomerStatusDto } from "./dto/update-customer-status.dto";

@ApiTags("Customer")
@Controller("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @setPermissions(Permissions.viewCustomerProfile)
  @Get("me")
  @ApiOperation({ summary: "Get current customer profile" })
  getProfile(@ActiveUser("sub") userId: number) {
    return this.customerService.getProfile(userId);
  }

  @setPermissions(Permissions.updateCustomerPersonalProfile)
  @Patch("me")
  @ApiOperation({ summary: "Update current customer profile" })
  updateProfile(@ActiveUser("sub") userId: number, @Body() dto: UpdateCustomerProfileDto) {
    return this.customerService.updateProfile(userId, dto);
  }

  @setPermissions(Permissions.viewCustomers)
  @Get()
  @ApiOperation({ summary: "List customers (admin/manager)" })
  @ApiResponse({ status: 200, description: "Customers retrieved successfully" })
  findAll(@Query() query: CustomerListQueryDto) {
    return this.customerService.findAll(query);
  }

  @setPermissions(Permissions.viewCustomers)
  @Get(":id")
  @ApiOperation({ summary: "Get customer by ID (admin/manager)" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @setPermissions(Permissions.manageCustomerStatus)
  @Patch(":id/status")
  @ApiOperation({ summary: "Enable or disable a customer account" })
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCustomerStatusDto) {
    return this.customerService.updateStatus(id, dto);
  }

  @setPermissions(Permissions.manageCustomerLoyalty)
  @Patch(":id/loyalty")
  @ApiOperation({ summary: "Adjust customer loyalty points" })
  adjustLoyalty(
    @Param("id", ParseIntPipe) id: number,
    @ActiveUser("sub") actorUserId: number,
    @Body() dto: AdjustCustomerLoyaltyDto,
  ) {
    return this.customerService.adjustLoyalty(id, actorUserId, dto);
  }
}

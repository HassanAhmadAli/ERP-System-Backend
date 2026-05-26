import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LoyaltyRewardService } from "./loyalty-reward.service";
import { LoyaltyPolicyService } from "./loyalty-policy.service";
import { CreateLoyaltyRewardDto } from "./dto/create-loyalty-reward.dto";
import { UpdateLoyaltyRewardDto } from "./dto/update-loyalty-reward.dto";
import { UpdateLoyaltyPolicyDto } from "./dto/update-loyalty-policy.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";

@ApiTags("Loyalty Rewards")
@Controller("loyalty-rewards")
export class LoyaltyRewardController {
  constructor(
    private readonly loyaltyRewardService: LoyaltyRewardService,
    private readonly loyaltyPolicyService: LoyaltyPolicyService,
  ) {}

  @Get("policy")
  @setPermissions(Permissions.manageLoyaltyRewards)
  @ApiOperation({ summary: "Get loyalty points policy" })
  getPolicy() {
    return this.loyaltyPolicyService.getPolicy();
  }

  @Patch("policy")
  @setPermissions(Permissions.manageLoyaltyPolicy)
  @ApiOperation({ summary: "Update loyalty points policy" })
  updatePolicy(@Body() dto: UpdateLoyaltyPolicyDto) {
    return this.loyaltyPolicyService.updatePolicy(dto);
  }

  @Get("available")
  @setPermissions(Permissions.viewAvailableLoyaltyRewards)
  @ApiOperation({ summary: "List active loyalty rewards (customer catalog)" })
  findAvailable(@ActiveUser("sub") userId: number, @Query() query: PaginationQueryDto) {
    return this.loyaltyRewardService.findAvailableForCustomer(userId, query);
  }

  @Post()
  @setPermissions(Permissions.manageLoyaltyRewards)
  @ApiOperation({ summary: "Create a loyalty reward" })
  create(@Body() dto: CreateLoyaltyRewardDto) {
    return this.loyaltyRewardService.create(dto);
  }

  @Get()
  @setPermissions(Permissions.manageLoyaltyRewards)
  @ApiOperation({ summary: "List loyalty rewards" })
  findAll(@Query() query: PaginationQueryDto) {
    return this.loyaltyRewardService.findAll(query);
  }

  @Get(":id")
  @setPermissions(Permissions.manageLoyaltyRewards)
  @ApiOperation({ summary: "Get loyalty reward by ID" })
  findOne(@Param("id") id: string) {
    return this.loyaltyRewardService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageLoyaltyRewards)
  @ApiOperation({ summary: "Update loyalty reward" })
  update(@Param("id") id: string, @Body() dto: UpdateLoyaltyRewardDto) {
    return this.loyaltyRewardService.update(id, dto);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageLoyaltyRewards)
  @ApiResponse({ status: 200, description: "Loyalty reward deleted" })
  remove(@Param("id") id: string) {
    return this.loyaltyRewardService.remove(id);
  }
}

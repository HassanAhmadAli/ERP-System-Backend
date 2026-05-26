import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LoyaltyRewardService } from "./loyalty-reward.service";
import { LoyaltyPolicyService } from "./loyalty-policy.service";
import { CreateLoyaltyRewardDto } from "./dto/create-loyalty-reward.dto";
import { UpdateLoyaltyRewardDto } from "./dto/update-loyalty-reward.dto";
import { UpdateLoyaltyPolicyDto } from "./dto/update-loyalty-policy.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";
import { MessageResponseDto } from "@/openapi/dto/responses.dto";

@ApiTags("Loyalty Rewards")
@ApiAuth()
@Controller("loyalty-rewards")
export class LoyaltyRewardController {
  constructor(
    private readonly loyaltyRewardService: LoyaltyRewardService,
    private readonly loyaltyPolicyService: LoyaltyPolicyService,
  ) {}

  @Get("policy")
  @setPermissions(Permissions.manageLoyaltyRewards)
  @DocumentOperation("Get loyalty points policy")
  @DocumentOkResponse("Loyalty policy")
  getPolicy() {
    return this.loyaltyPolicyService.getPolicy();
  }

  @Patch("policy")
  @setPermissions(Permissions.manageLoyaltyPolicy)
  @DocumentOperation("Update loyalty points policy")
  @DocumentBody(UpdateLoyaltyPolicyDto)
  @DocumentOkResponse("Policy updated")
  updatePolicy(@Body() dto: UpdateLoyaltyPolicyDto) {
    return this.loyaltyPolicyService.updatePolicy(dto);
  }

  @Get("available")
  @setPermissions(Permissions.viewAvailableLoyaltyRewards)
  @DocumentOperation("List redeemable loyalty rewards (customer)")
  @DocumentOkResponse("Rewards with canRedeem flag")
  findAvailable(@ActiveUser("sub") userId: number, @Query() query: PaginationQueryDto) {
    return this.loyaltyRewardService.findAvailableForCustomer(userId, query);
  }

  @Post()
  @setPermissions(Permissions.manageLoyaltyRewards)
  @DocumentOperation("Create loyalty reward offer")
  @DocumentBody(CreateLoyaltyRewardDto)
  @DocumentCreatedResponse("Reward created")
  create(@Body() dto: CreateLoyaltyRewardDto) {
    return this.loyaltyRewardService.create(dto);
  }

  @Get()
  @setPermissions(Permissions.manageLoyaltyRewards)
  @DocumentOperation("List loyalty rewards (staff)")
  @DocumentOkResponse("Paginated rewards")
  findAll(@Query() query: PaginationQueryDto) {
    return this.loyaltyRewardService.findAll(query);
  }

  @Get(":id")
  @setPermissions(Permissions.manageLoyaltyRewards)
  @DocumentOperation("Get loyalty reward by ID")
  @DocumentParam("id", "Reward UUID", { type: "string" })
  @DocumentOkResponse("Loyalty reward")
  findOne(@Param("id") id: string) {
    return this.loyaltyRewardService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageLoyaltyRewards)
  @DocumentOperation("Update loyalty reward")
  @DocumentParam("id", "Reward UUID", { type: "string" })
  @DocumentBody(UpdateLoyaltyRewardDto)
  @DocumentOkResponse("Reward updated")
  update(@Param("id") id: string, @Body() dto: UpdateLoyaltyRewardDto) {
    return this.loyaltyRewardService.update(id, dto);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageLoyaltyRewards)
  @DocumentOperation("Delete loyalty reward")
  @DocumentParam("id", "Reward UUID", { type: "string" })
  @DocumentOkResponse("Reward deleted", MessageResponseDto)
  remove(@Param("id") id: string) {
    return this.loyaltyRewardService.remove(id);
  }
}

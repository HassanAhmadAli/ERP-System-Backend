import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateLoyaltyRewardDto } from "./dto/create-discount-offer.dto";
import { UpdateLoyaltyRewardDto } from "./dto/update-discount-offer.dto";
import { RedeemLoyaltyOfferDto } from "./dto/redeem-discount-offer.dto";
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
import { LoyaltyRewardService } from "./loyalty-discount-offer.service";

@ApiTags("Loyalty Rewards")
@ApiAuth()
@Controller("loyalty-rewards")
export class LoyaltyRewardController {
  constructor(private readonly loyaltyRewardService: LoyaltyRewardService) {}

  @Get("available")
  @setPermissions(Permissions.viewAvailableLoyaltyRewards)
  @DocumentOperation("List redeemable loyalty rewards (customer)")
  @DocumentOkResponse("Rewards with canRedeem flag")
  findAvailable(@ActiveUser("sub") userId: number, @Query() query: PaginationQueryDto) {
    return this.loyaltyRewardService.findAvailableForCustomer(userId, query);
  }

  @Post("redeem")
  @setPermissions(Permissions.viewAvailableLoyaltyRewards)
  @DocumentOperation("Redeem loyalty points for a customer discount")
  @DocumentBody(RedeemLoyaltyOfferDto)
  @DocumentCreatedResponse("Redemption created with customer discount")
  redeem(@ActiveUser("sub") userId: number, @Body() dto: RedeemLoyaltyOfferDto) {
    return this.loyaltyRewardService.redeem(userId, dto);
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

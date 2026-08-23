import { Body, Controller, Get, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ApiAuth, DocumentBody, DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";
import { LoyaltyPolicyResponseDto, SetLoyaltyPolicyDto } from "./dto/loyalty-policy.dto";
import { LoyaltyPolicyService } from "./loyalty-policy.service";

@ApiTags("Loyalty Policy")
@ApiAuth()
@Controller("loyalty-policy")
export class LoyaltyPolicyController {
  constructor(private readonly loyaltyPolicyService: LoyaltyPolicyService) {}

  @Get()
  @setPermissions(Permissions.manageLoyaltyPolicy)
  @DocumentOperation(
    "Get the store loyalty points policy",
    "pointsPerCurrency is the multiplier applied to every currency unit spent.",
  )
  @DocumentOkResponse("Current loyalty policy", LoyaltyPolicyResponseDto)
  getPolicy() {
    return this.loyaltyPolicyService.getPolicy();
  }

  @Put()
  @setPermissions(Permissions.manageLoyaltyPolicy)
  @DocumentOperation(
    "Set the store loyalty points multiplier",
    "e.g. pointsPerCurrency=1.25 means spending 100 earns 125 points.",
  )
  @DocumentBody(SetLoyaltyPolicyDto)
  @DocumentOkResponse("Updated loyalty policy", LoyaltyPolicyResponseDto)
  setPolicy(@Body() dto: SetLoyaltyPolicyDto) {
    return this.loyaltyPolicyService.setPolicy(dto);
  }
}

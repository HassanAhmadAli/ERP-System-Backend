import { Module } from "@nestjs/common";
import { LoyaltyRewardService } from "./loyalty-reward.service";
import { LoyaltyPolicyService } from "./loyalty-policy.service";
import { LoyaltyRewardController } from "./loyalty-reward.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { NotificationsModule } from "@/notification/notification.module";

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LoyaltyRewardController],
  providers: [LoyaltyRewardService, LoyaltyPolicyService],
  exports: [LoyaltyRewardService, LoyaltyPolicyService],
})
export class LoyaltyRewardModule {}

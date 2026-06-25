import { Module } from "@nestjs/common";
import { LoyaltyRewardController } from "./loyalty-discount-offer.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { NotificationsModule } from "@/notification/notification.module";
import { AuditLogModule } from "@/audit-log/audit-log.module";
import { LoyaltyRewardService } from "./loyalty-discount-offer.service";

@Module({
  imports: [PrismaModule, NotificationsModule, AuditLogModule],
  providers: [LoyaltyRewardService],
  exports: [LoyaltyRewardService],
  controllers: [LoyaltyRewardController],
})
export class LoyaltyRewardModule {}

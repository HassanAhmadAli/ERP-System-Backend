import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { LoyaltyPolicyController } from "./loyalty-policy.controller";
import { LoyaltyPolicyService } from "./loyalty-policy.service";

@Module({
  imports: [PrismaModule],
  providers: [LoyaltyPolicyService],
  controllers: [LoyaltyPolicyController],
})
export class LoyaltyPolicyModule {}

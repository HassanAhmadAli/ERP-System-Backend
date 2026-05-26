import { Module } from "@nestjs/common";
import { RefreshTokenIdsStorage } from "./refresh-token-ids.storage";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";
import { NotificationsModule } from "@/notification/notification.module";
import { HashingModule } from "@/hashing/hashing.module";
import { CustomerAuthenticationService } from "./customer.authentication.service";

@Module({
  controllers: [AuthenticationController],
  providers: [RefreshTokenIdsStorage, CustomerAuthenticationService, AuthenticationService],
  imports: [HashingModule, NotificationsModule],
  exports: [HashingModule, AuthenticationService],
})
export class AuthenticationModule {}

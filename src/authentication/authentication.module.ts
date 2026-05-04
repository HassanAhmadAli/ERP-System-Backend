import { Module } from "@nestjs/common";
import { RefreshTokenIdsStorage } from "./refresh-token-ids.storage";
import { AccessTokenGuard } from "./guard/access-token.guard";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";
import { NotificationsModule } from "@/notification/notification.module";
import { HashingModule } from "@/hashing/hashing.module";

@Module({
  controllers: [AuthenticationController],
  providers: [AuthenticationService, RefreshTokenIdsStorage, AccessTokenGuard],
  imports: [HashingModule, HashingModule, NotificationsModule],
  exports: [AccessTokenGuard],
})
export class AuthenticationModule {}

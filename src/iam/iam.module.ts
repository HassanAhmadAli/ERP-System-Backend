import { Module } from "@nestjs/common";
import { RefreshTokenIdsStorage } from "./authentication/refresh-token-ids.storage";
import { AccessTokenGuard } from "./authentication/guard/access-token.guard";
import { AuthenticationController } from "./authentication/authentication.controller";
import { AuthenticationService } from "./authentication/authentication.service";
import { APP_GUARD } from "@nestjs/core";
import { AuthenticationGuard } from "./authentication/guard/authentication.guard";
import { RolesGuard } from "./authorization/guards/roles.guard";
import { NotificationsModule } from "@/notification/notification.module";
import { HashingModule } from "@/iam/hashing/hashing.module";
import { AppJwtModule } from "./jwt/appjwt.module";
@Module({
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    RefreshTokenIdsStorage,
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  imports: [AppJwtModule, HashingModule, NotificationsModule],
})
export class IdentityAndAccessManagementModule {}

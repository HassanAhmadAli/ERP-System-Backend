import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { RefreshTokenIdsStorage } from "./refresh-token-ids.storage";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";
import { NotificationsModule } from "@/notification/notification.module";
import { HashingModule } from "@/hashing/hashing.module";
import { CustomerAuthenticationService } from "./customer.authentication.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";

@Module({
  controllers: [AuthenticationController],
  providers: [
    RefreshTokenIdsStorage,
    CustomerAuthenticationService,
    AuthenticationService,
    JwtStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
  ],
  imports: [HashingModule, NotificationsModule, PassportModule.register({ defaultStrategy: "jwt" })],
  exports: [HashingModule, AuthenticationService],
})
export class AuthenticationModule {}

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { RefreshTokenIdsStorage } from "./authentication/refresh-token-ids.storage";
import { AccessTokenGuard } from "./authentication/guard/access-token.guard";
import { AuthenticationController } from "./authentication/authentication.controller";
import { AuthenticationService } from "./authentication/authentication.service";
import { APP_GUARD } from "@nestjs/core";
import { AuthenticationGuard } from "./authentication/guard/authentication.guard";
import { MailerModule } from "@nestjs-modules/mailer";
import { RolesGuard } from "./authorization/guards/roles.guard";
import { NotificationsModule } from "@/notifications/notifications.module";
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
  imports: [
    AppJwtModule,
    HashingModule,
    NotificationsModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(configService: ConfigService<EnvVariables>) {
        return {
          transport: {
            host: configService.get("APP_EMAIL_HOST", {
              infer: true,
            }),
            auth: {
              user: configService.get("APP_EMAIL_User", {
                infer: true,
              }),
              pass: configService.get("APP_EMAIL_Password", { infer: true }),
            },
          },
        };
      },
    }),
  ],
})
export class IdentityAndAccessManagementModule {}

import { Module } from "@nestjs/common";
import { NotificationsService } from "./notification.service";
import { NotificationsGateway } from "./notification.gateway";
import { BullModule } from "@nestjs/bullmq";
import { env } from "@/common/env";
import { Keys } from "@/common/const";
import { CommonModule } from "@/common/common.module";
import { NotificationConsumer } from "./notification.consumer";
import { HashingModule } from "@/iam/hashing/hashing.module";
import { AppJwtModule } from "@/iam/jwt/appjwt.module";
import { MailerModule } from "@/mailer/mailer.module";

@Module({
  imports: [
    MailerModule,
    AppJwtModule,
    CommonModule,
    HashingModule,
    BullModule.registerQueue({
      name: Keys.notification,
      connection: {
        url: env!.REDIS_DATABASE_URL,
      },
    }),
  ],
  providers: [NotificationsGateway, NotificationsService, NotificationConsumer],
  exports: [NotificationsGateway, NotificationsService, NotificationConsumer, BullModule],
})
export class NotificationsModule {}

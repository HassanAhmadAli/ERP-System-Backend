import { Module } from "@nestjs/common";
import { NotificationsService } from "./notification.service";
import { NotificationsGateway } from "./notification.gateway";
import { BullModule } from "@nestjs/bullmq";
import { env } from "@/common/env";
import { Keys } from "@/common/const";
import { NotificationConsumer } from "./notification.consumer";
import { HashingModule } from "@/hashing/hashing.module";
import { MailerModule } from "@/mailer/mailer.module";
import { CachingModule } from "@/caching/caching.module";

@Module({
  imports: [
    MailerModule,
    HashingModule,
    CachingModule,
    BullModule.registerQueue({
      name: Keys.notification,
      connection: {
        url: env!.REDIS_DATABASE_URL,
      },
    }),
    HashingModule,
  ],
  providers: [NotificationsGateway, NotificationsService, NotificationConsumer],
  exports: [NotificationsGateway, NotificationsService, NotificationConsumer, BullModule],
})
export class NotificationsModule {}

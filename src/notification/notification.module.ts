import { Module } from "@nestjs/common";
import { NotificationsService } from "./notification.service";
import { NotificationsGateway } from "./notification.gateway";
import { BullModule } from "@nestjs/bullmq";
import { Keys } from "@/common/const";
import { NotificationConsumer } from "./notification.consumer";
import { HashingModule } from "@/hashing/hashing.module";
import { MailerModule } from "@/mailer/mailer.module";
import { CachingModule } from "@/caching/caching.module";
import { NotificationInboxController } from "./notification-inbox.controller";
import { NotificationInboxService } from "./notification-inbox.service";
import { NotificationSendController } from "./notification-send.controller";
import { NotificationSendService } from "./notification-send.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    MailerModule,
    HashingModule,
    CachingModule,
    BullModule.registerQueue({
      name: Keys.notification,
    }),
  ],
  controllers: [NotificationInboxController, NotificationSendController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationConsumer,
    NotificationInboxService,
    NotificationSendService,
  ],
  exports: [NotificationsGateway, NotificationsService, NotificationConsumer, NotificationSendService, BullModule],
})
export class NotificationsModule {}

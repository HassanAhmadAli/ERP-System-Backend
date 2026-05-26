import { Module } from "@nestjs/common";
import { BackupService } from "./backup.service";
import { CachingModule } from "@/caching/caching.module";
import { BackupController } from "./backup.controller";
import { BackupConsumer } from "./backup.consumer";
import { Keys } from "@/common/const";
import { BullModule } from "@nestjs/bullmq";
import { NotificationsModule } from "@/notification/notification.module";

@Module({
  imports: [
    CachingModule,
    BullModule.registerQueue({
      name: Keys.backupQueue,
    }),
    NotificationsModule,
  ],
  controllers: [BackupController],
  providers: [BackupService, BackupConsumer],
})
export class BackupModule {}

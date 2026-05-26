import { Injectable, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { InjectQueue } from "@nestjs/bullmq";
import { Keys } from "@/common/const";
import { Queue } from "bullmq";
import { BackupInterface } from "./backup.interface";
@Injectable()
export class BackupService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService<EnvVariables>,
    @InjectQueue(Keys.backupQueue) private readonly backupQueue: Queue<BackupInterface>,
  ) {}
  onModuleInit() {}
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    if (!this.configService.getOrThrow("ENABLE_CRON_JOBS", { infer: true })) {
      return;
    }
    await this.addBackupOperationToQueue();
  }
  public async addBackupOperationToQueue() {
    await this.backupQueue.add("create-backup", { "backup-start-time": new Date().toISOString() });
  }
}

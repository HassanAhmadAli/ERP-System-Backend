import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Keys } from "@/common/const";
import { Job } from "bullmq";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { exec } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { logger } from "@/utils";
import { BackupService } from "./backup.service";
import { NotificationSendService } from "@/notification/notification-send.service";
@Processor(Keys.backupQueue)
export class BackupConsumer extends WorkerHost {
  constructor(
    private readonly configService: ConfigService<EnvVariables>,
    private readonly notificationSendService: NotificationSendService,
  ) {
    super();
  }

  override async process(job: Job<{ date: string }, object, string>) {
    logger.info({ caller: BackupService.name, msg: "Starting database backup..." });
    try {
      const path = await this.backupDatabase();
      await this.notificationSendService.send(1, {
        title: "Backup Success",
        targetType: "ROLE",
        targetRole: "STORE_MANAGER",
        body: `backup successfully created at path ${path} , started at ${job.data.date}`,
      });
    } catch (error) {
      let errorMessage: string = "Unknown Exception";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      await this.notificationSendService.send(1, {
        title: "Backup Failed",
        targetType: "ROLE",
        targetRole: "STORE_MANAGER",
        body: `backup Failed ${errorMessage}, started at ${job.data.date}`,
      });
      throw error;
    }
  }
  public async backupDatabase(): Promise<string> {
    const backupDir = this.configService.getOrThrow("backupDir", { infer: true });
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const fileName = `backup-${new Date().toISOString().replace(/:/g, "-")}.sql`;
    const filePath = path.join(backupDir, fileName);

    const command = `pg_dump -d ${this.configService.getOrThrow("DATABASE_URL")} -F c -b -v -f "${filePath}"`;
    return new Promise((resolve, reject) => {
      exec(command, (error, _stdout, stderr) => {
        if (error) {
          logger.error({ caller: BackupService.name, msg: `Backup failed: ${error.message}` });
          if (stderr) {
            logger.error({ caller: BackupService.name, msg: `pg_dump stderr: ${stderr}` });
          }
          // Reject the promise so the calling function knows it failed
          return reject(error);
        }

        if (stderr) {
          logger.info({ caller: BackupService.name, msg: `Backup stderr (verbose output): ${stderr}` });
        }
        logger.info({ caller: BackupService.name, msg: `Backup successful! File created at: ${filePath}` });

        // Resolve the promise successfully, passing the filePath back
        resolve(filePath);
      });
    });
  }
}

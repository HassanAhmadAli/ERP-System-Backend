import { Injectable, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { exec } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { logger } from "@/utils";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { CachingService } from "@/common/caching/caching.service";
@Injectable()
export class BackupService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService<EnvVariables>,
    private readonly cachingService: CachingService,
  ) {}
  onModuleInit() {}
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleCron() {
    if (!this.configService.getOrThrow("ENABLE_CRON_JOBS", { infer: true })) {
      return;
    }
    logger.info({ caller: BackupService.name, msg: "Starting database backup..." });
    this.backupDatabase();
  }
  private backupDatabase() {
    const backupDir = this.configService.getOrThrow("backupDir", { infer: true });
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const fileName = `backup-${new Date().toISOString().replace(/:/g, "-")}.sql`;
    const filePath = path.join(backupDir, fileName);

    const command = `pg_dump -d ${this.configService.getOrThrow("DATABASE_URL")} -F c -b -v -f "${filePath}"`;

    exec(command, (error, _stdout, stderr) => {
      if (error) {
        logger.error({ caller: BackupService.name, msg: `Backup failed: ${error.message}` });
        if (stderr) {
          logger.error({ caller: BackupService.name, msg: `pg_dump stderr: ${stderr}` });
        }
        return;
      }
      if (stderr) {
        logger.info({ caller: BackupService.name, msg: `Backup stderr (verbose output): ${stderr}` });
      }
      logger.info({ caller: BackupService.name, msg: `Backup successful! File created at: ${filePath}` });
    });
  }
}

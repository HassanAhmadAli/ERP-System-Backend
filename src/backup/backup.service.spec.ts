/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { getQueueToken } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { EnvVariables } from "@/common/schema/env";
import { BackupInterface } from "./backup.interface";
import { BackupService } from "./backup.service";

describe("BackupService", () => {
  let service: BackupService;
  let configService: jest.Mocked<ConfigService<EnvVariables>>;
  let backupQueue: jest.Mocked<Queue<BackupInterface>>;

  beforeEach(async () => {
    configService = mock<ConfigService<EnvVariables>>();
    backupQueue = mock<Queue<BackupInterface>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: ConfigService, useValue: configService },
        { provide: getQueueToken("backup"), useValue: backupQueue },
      ],
    }).compile();

    service = module.get(BackupService);
  });

  describe("handleCron", () => {
    it("adds backup job when ENABLE_CRON_JOBS is true", async () => {
      configService.getOrThrow.mockReturnValue(true);

      await service.handleCron();

      expect(backupQueue.add).toHaveBeenCalledWith("create-backup", {
        "backup-start-time": expect.any(String) as string,
      });
    });

    it("does nothing when ENABLE_CRON_JOBS is false", async () => {
      configService.getOrThrow.mockReturnValue(false);

      await service.handleCron();

      expect(backupQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("addBackupOperationToQueue", () => {
    it("adds a backup job with ISO timestamp", async () => {
      const mockDate = "2024-06-15T00:00:00.000Z";
      jest.spyOn(Date.prototype, "toISOString").mockReturnValue(mockDate);

      await service.addBackupOperationToQueue();

      expect(backupQueue.add).toHaveBeenCalledWith("create-backup", {
        "backup-start-time": mockDate,
      });
    });
  });

  describe("onModuleInit", () => {
    it("does not throw", () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });
});

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import { EnvVariables } from "@/common/schema/env";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { BackupConsumer } from "./backup.consumer";
import { NotificationSendService } from "@/notification/notification-send.service";
import { exec } from "child_process";

jest.mock("./backup.service", () => ({
  BackupService: class {},
}));

jest.mock("@/notification/notification-send.service", () => ({
  NotificationSendService: class MockNotificationSendService {},
}));

jest.mock("@nestjs/bullmq", () => {
  function MockWorkerHost(this: void) {
    // no-op: skip creating a real Worker/redis connection
  }
  return {
    WorkerHost: MockWorkerHost,
    Processor: () => () => {},
    InjectQueue: () => () => {},
  };
});

jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

jest.mock("bullmq", () => ({
  Job: class MockJob {},
  Queue: class MockQueue {},
}));

const mockedExec = jest.mocked(exec);

function makeExecSuccess() {
  mockedExec.mockImplementation((cmd: any, ...rest: any[]) => {
    const cb = rest.find((r: any) => typeof r === "function");
    if (cb) cb(null, "", "");
    return {} as ReturnType<typeof exec>;
  });
}

function makeExecError(msg: string) {
  mockedExec.mockImplementation((cmd: any, ...rest: any[]) => {
    const cb = rest.find((r: any) => typeof r === "function");
    if (cb) cb(new Error(msg), "", "stderr");
    return {} as ReturnType<typeof exec>;
  });
}

describe("BackupConsumer", () => {
  let consumer: BackupConsumer;
  let configService: jest.Mocked<ConfigService<EnvVariables>>;
  let notificationSendService: jest.Mocked<NotificationSendService>;
  let i18n: jest.Mocked<I18nService<I18nTranslations>>;

  const mockJob = {
    data: { date: "2024-06-15T00:00:00.000Z" },
  } as Job<{ date: string }, object, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = mock<ConfigService<EnvVariables>>();
    notificationSendService = mock<NotificationSendService>();
    i18n = mock<I18nService<I18nTranslations>>();

    consumer = new BackupConsumer(configService, notificationSendService, i18n);
  });

  describe("process", () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, "toISOString").mockReturnValue("2024-06-15T00:00:00.000Z");
    });

    it("sends success notification when backup succeeds", async () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === "backupDir") return "/tmp/backups";
        if (key === "DATABASE_URL") return "postgres://user:pass@localhost/db";
        throw new Error(`Unknown key: ${key}`);
      });
      makeExecSuccess();
      i18n.t.mockImplementation((key: string) => {
        if (key === "notifications.backup.successTitle") return "Backup successful";
        if (key === "notifications.backup.successBody")
          return "Backup saved to /tmp/backups/backup-2024-06-15T00-00-00.000Z.sql";
        return key;
      });

      await consumer.process(mockJob);

      expect(notificationSendService.send).toHaveBeenCalledWith(1, {
        title: "Backup successful",
        targetType: "ROLE",
        targetRole: "STORE_MANAGER",
        body: expect.stringContaining("/tmp/backups/backup-") as string,
      });
    });

    it("sends failure notification and rethrows on error", async () => {
      configService.getOrThrow.mockReturnValue("/tmp/backups");
      makeExecError("pg_dump failed");
      i18n.t.mockImplementation((key: string) => {
        if (key === "notifications.backup.failedTitle") return "Backup failed";
        if (key === "notifications.backup.failedBody") return "Backup failed: pg_dump failed";
        return key;
      });

      await expect(consumer.process(mockJob)).rejects.toThrow("pg_dump failed");
      expect(notificationSendService.send).toHaveBeenCalledWith(1, {
        title: "Backup failed",
        targetType: "ROLE",
        targetRole: "STORE_MANAGER",
        body: expect.stringContaining("pg_dump failed") as string,
      });
    });
  });

  describe("backupDatabase", () => {
    it("resolves with file path on success", async () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === "backupDir") return "/tmp/backups";
        if (key === "DATABASE_URL") return "postgres://user:pass@localhost/db";
        throw new Error(`Unknown key: ${key}`);
      });
      makeExecSuccess();
      jest.spyOn(Date.prototype, "toISOString").mockReturnValue("2024-06-15T00:00:00.000Z");

      const result = await consumer.backupDatabase();

      expect(result).toMatch(/^\/tmp\/backups\/backup-.*\.sql$/);
    });

    it("rejects when exec fails", async () => {
      configService.getOrThrow.mockReturnValue("/tmp/backups");
      makeExecError("Connection refused");

      await expect(consumer.backupDatabase()).rejects.toThrow("Connection refused");
    });
  });
});

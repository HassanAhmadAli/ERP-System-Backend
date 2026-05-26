import { Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BackupService } from "./backup.service";

@ApiTags("backup")
@Controller("backup")
export class BackupController {
  constructor(private readonly backupService: BackupService) {}
  @Post("create")
  async createBackup() {
    await this.backupService.addBackupOperationToQueue();
    return { message: "Backup is Being created, you will recieve a notificatino when the operation is completed" };
  }
}

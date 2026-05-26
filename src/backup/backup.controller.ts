import { Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BackupService } from "./backup.service";
import { ApiAuth, DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";
import { MessageResponseDto } from "@/openapi/dto/responses.dto";

@ApiTags("Backup")
@ApiAuth()
@Controller("backup")
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post("create")
  @DocumentOperation("Queue database backup", "Runs asynchronously; notification sent when complete.")
  @DocumentOkResponse("Backup job queued", MessageResponseDto)
  async createBackup() {
    await this.backupService.addBackupOperationToQueue();
    return { message: "Backup is Being created, you will recieve a notificatino when the operation is completed" };
  }
}

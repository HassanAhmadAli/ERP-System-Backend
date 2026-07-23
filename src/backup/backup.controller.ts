import { Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BackupService } from "./backup.service";
import { ApiAuth, DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";
import { MessageResponseDto } from "@/openapi/dto/responses.dto";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

@ApiTags("Backup")
@ApiAuth()
@Controller("backup")
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  @Post("create")
  @DocumentOperation("Queue database backup", "Runs asynchronously; notification sent when complete.")
  @DocumentOkResponse("Backup job queued", MessageResponseDto)
  async createBackup() {
    await this.backupService.addBackupOperationToQueue();
    return { message: this.i18n.t("responses.backup.started") };
  }
}

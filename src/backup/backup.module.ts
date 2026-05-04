import { Module } from "@nestjs/common";
import { BackupService } from "./backup.service";
import { CachingModule } from "@/caching/caching.module";

@Module({
  imports: [CachingModule],
  providers: [BackupService],
})
export class BackupModule {}

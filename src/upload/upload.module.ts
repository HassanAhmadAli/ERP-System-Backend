import { Module } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { MulterModule } from "@nestjs/platform-express";
@Module({
  imports: [
    MulterModule.register({
      dest: "./uploads",
    }),
  ],
  exports: [MulterModule],
  providers: [UploadService],
})
export class UploadModule {}

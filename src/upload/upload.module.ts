import { Module } from "@nestjs/common";
import { AppUploadService } from "./upload.service";
import { MulterModule } from "@nestjs/platform-express";
@Module({
  imports: [
    MulterModule.register({
      dest: "./uploads",
    }),
  ],
  exports: [MulterModule],
  providers: [AppUploadService],
})
export class UploadModule {}

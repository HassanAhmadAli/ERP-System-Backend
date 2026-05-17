import { Module } from "@nestjs/common";
import { ProductPhotoService } from "./product-photo.service";
import { ProductPhotoController } from "./product-photo.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { UploadModule } from "@/upload/upload.module";

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [ProductPhotoController],
  providers: [ProductPhotoService],
  exports: [ProductPhotoService],
})
export class ProductPhotoModule {}

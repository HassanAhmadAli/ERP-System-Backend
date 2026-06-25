import { Module } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CategoryImageService } from "./category-image.service";
import { CategoryController } from "./category.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { UploadModule } from "@/upload/upload.module";

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryImageService],
  exports: [CategoryService],
})
export class CategoryModule {}

import { Controller, Get, Param, ParseIntPipe, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProductPhotoService } from "./product-photo.service";
import { Public } from "@/common/decorators/public.decorator";
import { FileMimeStandarizingPipe } from "../common/pipe/file-mime-standarizing.pipe";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";

@Controller("product-photo")
export class ProductPhotoController {
  constructor(private readonly productPhotoService: ProductPhotoService) {}

  @setPermissions(Permissions.manageProduct)
  @Post("upload/:productId")
  @UseInterceptors(FileInterceptor("file"))
  uploadProductPhoto(
    @Param("productId", ParseIntPipe) productId: number,
    @ActiveUser("sub") creatorId: number,
    @UploadedFile(new FileMimeStandarizingPipe()) file: Express.Multer.File,
  ) {
    return this.productPhotoService.uploadProductPhoto(productId, creatorId, file);
  }

  @Public()
  @Get("download/:storedFileId")
  downloadProductPhoto(@Param("storedFileId") storedFileId: string) {
    return this.productPhotoService.downloadProductPhoto(storedFileId);
  }
}

import { Controller, Delete, Get, Param, ParseIntPipe, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { ProductPhotoService } from "./product-photo.service";
import { Public } from "@/common/decorators/public.decorator";
import { FileMimeStandarizingPipe } from "../common/pipe/file-mime-standarizing.pipe";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import {
  ApiAuth,
  DocumentImageUpload,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";

@ApiTags("Product Photos")
@ApiAuth()
@Controller("product-photo")
export class ProductPhotoController {
  constructor(private readonly productPhotoService: ProductPhotoService) {}

  @setPermissions(Permissions.manageProduct)
  @Post("upload/:productId")
  @UseInterceptors(FileInterceptor("file"))
  @DocumentOperation("Upload product photo")
  @DocumentParam("productId", "Product ID")
  @DocumentImageUpload()
  @DocumentOkResponse("Photo uploaded")
  uploadProductPhoto(
    @Param("productId", ParseIntPipe) productId: number,
    @ActiveUser("sub") creatorId: number,
    @UploadedFile(new FileMimeStandarizingPipe()) file: Express.Multer.File,
  ) {
    return this.productPhotoService.uploadProductPhoto(productId, creatorId, file);
  }

  @Get("product/:productId")
  @setPermissions(Permissions.viewProducts)
  @DocumentOperation("List photos for a product")
  @DocumentParam("productId", "Product ID")
  @DocumentOkResponse("Product photos")
  listByProduct(@Param("productId", ParseIntPipe) productId: number) {
    return this.productPhotoService.listByProduct(productId);
  }

  @setPermissions(Permissions.manageProduct)
  @Delete(":id")
  @DocumentOperation("Delete product photo")
  @DocumentParam("id", "Product photo ID")
  @DocumentOkResponse("Photo deleted")
  deleteProductPhoto(@Param("id", ParseIntPipe) id: number) {
    return this.productPhotoService.deleteProductPhoto(id);
  }

  @Public()
  @Get("download/:storedFileId")
  @DocumentOperation("Download product photo file", "Public file download by storage ID.")
  @DocumentParam("storedFileId", "Stored file UUID", { type: "string" })
  @DocumentOkResponse("Binary file stream")
  downloadProductPhoto(@Param("storedFileId") storedFileId: string) {
    return this.productPhotoService.downloadProductPhoto(storedFileId);
  }
}

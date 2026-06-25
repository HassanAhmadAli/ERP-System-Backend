import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CategoryService } from "./category.service";
import { CategoryImageService } from "./category-image.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { ApiTags } from "@nestjs/swagger";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { SearchQueryDto } from "@/common/dto/search-query.dto";
import { Public } from "@/common/decorators/public.decorator";
import { FileMimeStandarizingPipe } from "@/common/pipe/file-mime-standarizing.pipe";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentImageUpload,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";

@ApiTags("Categories")
@ApiAuth()
@Controller("category")
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly categoryImageService: CategoryImageService,
  ) {}

  @Post()
  @setPermissions(Permissions.manageCategories)
  @DocumentOperation("Create a new category")
  @DocumentBody(CreateCategoryDto)
  @DocumentCreatedResponse("Category created")
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @DocumentOperation("List categories", "Paginated with optional search.")
  @DocumentOkResponse("Paginated categories")
  findAll(@Query() { search, ...paginationQuery }: SearchQueryDto) {
    return this.categoryService.findAll(paginationQuery, search);
  }

  @Public()
  @Get("image/download/:storedFileId")
  @DocumentOperation("Download category image", "Public file download by storage ID.")
  @DocumentParam("storedFileId", "Stored file UUID", { type: "string" })
  @DocumentOkResponse("Binary file stream")
  downloadImage(@Param("storedFileId") storedFileId: string) {
    return this.categoryImageService.downloadCategoryImage(storedFileId);
  }

  @Get(":id")
  @DocumentOperation("Get category by ID", "Includes linked products.")
  @DocumentParam("id", "Category ID")
  @DocumentOkResponse("Category with products")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Post(":id/image")
  @setPermissions(Permissions.manageCategories)
  @UseInterceptors(FileInterceptor("file"))
  @DocumentOperation("Upload category image")
  @DocumentParam("id", "Category ID")
  @DocumentImageUpload()
  @DocumentOkResponse("Category image uploaded")
  uploadImage(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile(new FileMimeStandarizingPipe()) file: Express.Multer.File,
  ) {
    return this.categoryImageService.uploadCategoryImage(id, file);
  }

  @Delete(":id/image")
  @setPermissions(Permissions.manageCategories)
  @DocumentOperation("Delete category image")
  @DocumentParam("id", "Category ID")
  @DocumentOkResponse("Category image deleted")
  deleteImage(@Param("id", ParseIntPipe) id: number) {
    return this.categoryImageService.deleteCategoryImage(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageCategories)
  @DocumentOperation("Update category")
  @DocumentParam("id", "Category ID")
  @DocumentBody(UpdateCategoryDto)
  @DocumentOkResponse("Category updated")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageCategories)
  @DocumentOperation("Delete category", "Fails if products are still linked.")
  @DocumentParam("id", "Category ID")
  @DocumentOkResponse("Category deleted")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}

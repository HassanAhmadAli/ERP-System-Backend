import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { ApiTags } from "@nestjs/swagger";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { SearchQueryDto } from "@/common/dto/search-query.dto";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";

@ApiTags("Categories")
@ApiAuth()
@Controller("category")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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

  @Get(":id")
  @DocumentOperation("Get category by ID", "Includes linked products.")
  @DocumentParam("id", "Category ID")
  @DocumentOkResponse("Category with products")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
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

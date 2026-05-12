import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";

@ApiTags("Categories")
@Controller("category")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @setPermissions(Permissions.manageCategories)
  @ApiOperation({ summary: "Create a new category" })
  @ApiResponse({ status: 201, description: "Category created successfully" })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all categories with pagination and search" })
  @ApiResponse({ status: 200, description: "Categories retrieved successfully" })
  findAll(@Query() paginationQuery: PaginationQueryDto, @Query("search") search: string | undefined) {
    return this.categoryService.findAll(paginationQuery, search);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a category by ID (includes products)" })
  @ApiResponse({ status: 200, description: "Category retrieved successfully" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageCategories)
  @ApiOperation({ summary: "Update a category" })
  @ApiResponse({ status: 200, description: "Category updated successfully" })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageCategories)
  @ApiOperation({ summary: "Delete a category (only if no products linked)" })
  @ApiResponse({ status: 200, description: "Category deleted successfully" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}

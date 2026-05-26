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
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { readFileSync } from "node:fs";
import { ProductService } from "./product.service";
import { ProductImportService } from "./product-import.service";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Permissions } from "@/access-control/permission.type";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { SearchQueryDto } from "@/common/dto/search-query.dto";
import { UpdateStockDto } from "./dto/update-stock.dto";

@ApiTags("Products")
@Controller("product")
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImportService: ProductImportService,
  ) {}

  @Post()
  @setPermissions(Permissions.addProduct)
  @ApiOperation({ summary: "Create a new product" })
  @ApiResponse({
    status: 201,
    description: "Product created successfully",
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all products with pagination and search" })
  @ApiResponse({
    status: 200,
    description: "Products retrieved successfully",
  })
  getProducts(@Query() { search, ...paginationQuery }: SearchQueryDto) {
    return this.productService.getProducts(paginationQuery, search);
  }

  @Get("category/:categoryId")
  @ApiOperation({ summary: "Get products by category" })
  @ApiResponse({
    status: 200,
    description: "Products retrieved successfully",
  })
  getProductsByCategory(
    @Param("categoryId", ParseIntPipe) categoryId: number,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.productService.getProductsByCategory(categoryId, paginationQuery);
  }

  @Get("supplier/:supplierId")
  @ApiOperation({ summary: "Get products by supplier" })
  @ApiResponse({
    status: 200,
    description: "Products retrieved successfully",
  })
  getProductsBySupplier(
    @Param("supplierId", ParseIntPipe) supplierId: number,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.productService.getProductsBySupplier(supplierId, paginationQuery);
  }

  @Post("import")
  @setPermissions(Permissions.manageProduct)
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Bulk import products from CSV" })
  importCsv(@ActiveUser("sub") userId: number, @UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer && !file?.path) {
      throw new BadRequestException("CSV file is required");
    }
    const content = file.buffer?.toString("utf-8") ?? (file.path ? readFileSync(file.path, "utf-8") : "");
    if (!content) {
      throw new BadRequestException("Could not read CSV file contents");
    }
    return this.productImportService.importFromCsv(userId, file.originalname, content);
  }

  @Get("import/jobs")
  @setPermissions(Permissions.manageProduct)
  @ApiOperation({ summary: "List recent product import jobs" })
  listImportJobs() {
    return this.productImportService.listJobs();
  }

  @Get("import/:jobId")
  @setPermissions(Permissions.manageProduct)
  @ApiOperation({ summary: "Get product import job status" })
  getImportJob(@Param("jobId", ParseIntPipe) jobId: number) {
    return this.productImportService.getJob(jobId);
  }

  @Get("low-stock")
  @setPermissions(Permissions.manageProduct)
  @ApiOperation({ summary: "Get products with low stock" })
  @ApiResponse({
    status: 200,
    description: "Low stock products retrieved successfully",
  })
  getLowStockProducts(@Query() paginationQuery: PaginationQueryDto) {
    return this.productService.getLowStockProducts(paginationQuery);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a product by ID" })
  @ApiResponse({
    status: 200,
    description: "Product retrieved successfully",
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageProduct)
  @ApiOperation({ summary: "Update a product" })
  @ApiResponse({
    status: 200,
    description: "Product updated successfully",
  })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Patch(":id/stock")
  @setPermissions(Permissions.manageProduct)
  @ApiOperation({ summary: "Update product stock" })
  @ApiResponse({
    status: 200,
    description: "Stock updated successfully",
  })
  updateStock(@Param("id", ParseIntPipe) id: number, @Body() { quantityInStock }: UpdateStockDto) {
    if (quantityInStock < 0) {
      throw new BadRequestException("Insufficient stock");
    }
    return this.productService.updateStock(id, quantityInStock);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageProduct)
  @ApiOperation({ summary: "Delete a product" })
  @ApiResponse({
    status: 200,
    description: "Product deleted successfully",
  })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}

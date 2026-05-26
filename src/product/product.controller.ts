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
import { ApiTags } from "@nestjs/swagger";
import { ProductService } from "./product.service";
import { ProductImportService } from "./product-import.service";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { SearchQueryDto } from "@/common/dto/search-query.dto";
import { UpdateStockDto } from "./dto/update-stock.dto";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentCsvUpload,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";

@ApiTags("Products")
@ApiAuth()
@Controller("product")
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImportService: ProductImportService,
  ) {}

  @Post()
  @setPermissions(Permissions.addProduct)
  @DocumentOperation("Create a new product")
  @DocumentBody(CreateProductDto)
  @DocumentCreatedResponse("Product created")
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @DocumentOperation("List products", "Paginated catalog with optional search term.")
  @DocumentOkResponse("Paginated products")
  getProducts(@Query() { search, ...paginationQuery }: SearchQueryDto) {
    return this.productService.getProducts(paginationQuery, search);
  }

  @Get("category/:categoryId")
  @DocumentOperation("List products by category")
  @DocumentParam("categoryId", "Category ID")
  @DocumentOkResponse("Paginated products in category")
  getProductsByCategory(
    @Param("categoryId", ParseIntPipe) categoryId: number,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.productService.getProductsByCategory(categoryId, paginationQuery);
  }

  @Get("supplier/:supplierId")
  @DocumentOperation("List products by supplier")
  @DocumentParam("supplierId", "Supplier ID")
  @DocumentOkResponse("Paginated products from supplier")
  getProductsBySupplier(
    @Param("supplierId", ParseIntPipe) supplierId: number,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.productService.getProductsBySupplier(supplierId, paginationQuery);
  }

  @Post("import")
  @setPermissions(Permissions.manageProduct)
  @UseInterceptors(FileInterceptor("file"))
  @DocumentOperation("Bulk import products from CSV")
  @DocumentCsvUpload()
  @DocumentCreatedResponse("Import job started")
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
  @DocumentOperation("List recent product import jobs")
  @DocumentOkResponse("Import jobs")
  listImportJobs() {
    return this.productImportService.listJobs();
  }

  @Get("import/:jobId")
  @setPermissions(Permissions.manageProduct)
  @DocumentOperation("Get product import job status")
  @DocumentParam("jobId", "Import job ID")
  @DocumentOkResponse("Import job details")
  getImportJob(@Param("jobId", ParseIntPipe) jobId: number) {
    return this.productImportService.getJob(jobId);
  }

  @Get("low-stock")
  @setPermissions(Permissions.manageProduct)
  @DocumentOperation("List low-stock products")
  @DocumentOkResponse("Paginated low-stock products")
  getLowStockProducts(@Query() paginationQuery: PaginationQueryDto) {
    return this.productService.getLowStockProducts(paginationQuery);
  }

  @Get(":id")
  @DocumentOperation("Get product by ID")
  @DocumentParam("id", "Product ID")
  @DocumentOkResponse("Product details")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageProduct)
  @DocumentOperation("Update product")
  @DocumentParam("id", "Product ID")
  @DocumentBody(UpdateProductDto)
  @DocumentOkResponse("Product updated")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Patch(":id/stock")
  @setPermissions(Permissions.manageProduct)
  @DocumentOperation("Update product stock quantity")
  @DocumentParam("id", "Product ID")
  @DocumentBody(UpdateStockDto)
  @DocumentOkResponse("Stock updated")
  updateStock(@Param("id", ParseIntPipe) id: number, @Body() { quantityInStock }: UpdateStockDto) {
    if (quantityInStock < 0) {
      throw new BadRequestException("Insufficient stock");
    }
    return this.productService.updateStock(id, quantityInStock);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageProduct)
  @DocumentOperation("Delete product")
  @DocumentParam("id", "Product ID")
  @DocumentOkResponse("Product deleted")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}

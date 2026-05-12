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
} from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Permissions } from "@/access-control/permission.type";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

@ApiTags("Products")
@Controller("product")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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
  getProducts(@Query() paginationQuery: PaginationQueryDto, @Query("search") search: string | undefined) {
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

  @Get("low-stock")
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
  @setPermissions()
  @ApiOperation({ summary: "Update a product" })
  @ApiResponse({
    status: 200,
    description: "Product updated successfully",
  })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Patch(":id/stock")
  @setPermissions()
  @ApiOperation({ summary: "Update product stock" })
  @ApiResponse({
    status: 200,
    description: "Stock updated successfully",
  })
  updateStock(@Param("id", ParseIntPipe) id: number, @Body("quantityInStock", ParseIntPipe) quantityInStock: number) {
    if (quantityInStock < 0) {
      throw new BadRequestException("Insufficient stock");
    }
    return this.productService.updateStock(id, quantityInStock);
  }

  @Delete(":id")
  @setPermissions()
  @ApiOperation({ summary: "Delete a product" })
  @ApiResponse({
    status: 200,
    description: "Product deleted successfully",
  })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}

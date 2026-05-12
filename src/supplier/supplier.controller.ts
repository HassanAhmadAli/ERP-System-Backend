import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from "@nestjs/common";
import { SupplierService } from "./supplier.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";

@ApiTags("Suppliers")
@Controller("supplier")
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @setPermissions(Permissions.manageSuppliers)
  @ApiOperation({ summary: "Create a new supplier" })
  @ApiResponse({ status: 201, description: "Supplier created successfully" })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all suppliers with pagination and search" })
  @ApiResponse({ status: 200, description: "Suppliers retrieved successfully" })
  findAll(@Query() paginationQuery: PaginationQueryDto, @Query("search") search: string | undefined) {
    return this.supplierService.findAll(paginationQuery, search);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a supplier by ID (includes products and invoices)" })
  @ApiResponse({ status: 200, description: "Supplier retrieved successfully" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.supplierService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageSuppliers)
  @ApiOperation({ summary: "Update a supplier" })
  @ApiResponse({ status: 200, description: "Supplier updated successfully" })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.supplierService.update(id, updateSupplierDto);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageSuppliers)
  @ApiOperation({ summary: "Delete a supplier (only if no products or invoices linked)" })
  @ApiResponse({ status: 200, description: "Supplier deleted successfully" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.supplierService.remove(id);
  }
}

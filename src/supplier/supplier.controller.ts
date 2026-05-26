import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SupplierService } from "./supplier.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
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

@ApiTags("Suppliers")
@ApiAuth()
@Controller("supplier")
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @setPermissions(Permissions.manageSuppliers)
  @DocumentOperation("Create supplier")
  @DocumentBody(CreateSupplierDto)
  @DocumentCreatedResponse("Supplier created")
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  @DocumentOperation("List suppliers")
  @DocumentOkResponse("Paginated suppliers")
  findAll(@Query() { search, ...paginationQuery }: SearchQueryDto) {
    return this.supplierService.findAll(paginationQuery, search);
  }

  @Get(":id")
  @DocumentOperation("Get supplier by ID", "Includes products and purchase invoices.")
  @DocumentParam("id", "Supplier ID")
  @DocumentOkResponse("Supplier details")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.supplierService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageSuppliers)
  @DocumentOperation("Update supplier")
  @DocumentParam("id", "Supplier ID")
  @DocumentBody(UpdateSupplierDto)
  @DocumentOkResponse("Supplier updated")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.supplierService.update(id, updateSupplierDto);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageSuppliers)
  @DocumentOperation("Delete supplier", "Fails when products or invoices are linked.")
  @DocumentParam("id", "Supplier ID")
  @DocumentOkResponse("Supplier deleted")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.supplierService.remove(id);
  }
}

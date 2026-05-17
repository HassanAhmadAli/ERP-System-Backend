import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SalesService } from "./sales.service";
import { CreateSalesInvoiceDto } from "./dto/create-sales-invoice.dto";
import { UpdateSalesInvoiceStatusDto } from "./dto/update-sales-invoice-status.dto";
import { SalesInvoiceQueryDto } from "./dto/sales-invoice-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";

@ApiTags("Sales")
@Controller("sales/invoices")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @setPermissions(Permissions.createSales)
  @ApiOperation({ summary: "Create a sales invoice (POS)" })
  @ApiResponse({ status: 201, description: "Invoice created successfully" })
  create(@ActiveUser("sub") userId: number, @Body() dto: CreateSalesInvoiceDto) {
    return this.salesService.create(userId, dto);
  }

  @Get()
  @setPermissions(Permissions.viewSales)
  @ApiOperation({ summary: "List sales invoices" })
  @ApiResponse({ status: 200, description: "Invoices retrieved successfully" })
  findAll(@Query() query: SalesInvoiceQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get(":id")
  @setPermissions(Permissions.viewSales)
  @ApiOperation({ summary: "Get a sales invoice by ID" })
  @ApiResponse({ status: 200, description: "Invoice retrieved successfully" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Patch(":id/status")
  @setPermissions(Permissions.manageSales)
  @ApiOperation({ summary: "Update sales invoice status" })
  @ApiResponse({ status: 200, description: "Invoice status updated successfully" })
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSalesInvoiceStatusDto) {
    return this.salesService.updateStatus(id, dto);
  }
}

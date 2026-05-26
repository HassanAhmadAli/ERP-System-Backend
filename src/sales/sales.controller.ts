import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SalesService } from "./sales.service";
import { CreateSalesInvoiceDto } from "./dto/create-sales-invoice.dto";
import { UpdateSalesInvoiceStatusDto } from "./dto/update-sales-invoice-status.dto";
import { SalesInvoiceQueryDto } from "./dto/sales-invoice-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { UserRole } from "@/prisma";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";

@ApiTags("Sales")
@ApiAuth()
@Controller("sales/invoices")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @setPermissions(Permissions.createSales)
  @DocumentOperation("Create sales invoice (POS)", "Set complete=true to finalize payment and deduct stock.")
  @DocumentBody(CreateSalesInvoiceDto)
  @DocumentCreatedResponse("Invoice created")
  create(@ActiveUser("sub") userId: number, @Body() dto: CreateSalesInvoiceDto) {
    return this.salesService.create(userId, dto);
  }

  @Get()
  @setPermissions(Permissions.viewSales)
  @DocumentOperation("List sales invoices")
  @DocumentOkResponse("Paginated invoices")
  findAll(@Query() query: SalesInvoiceQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get(":id")
  @setPermissions(Permissions.viewSales)
  @DocumentOperation("Get sales invoice by ID", "Use response for printing receipts.")
  @DocumentParam("id", "Invoice ID")
  @DocumentOkResponse("Invoice with line items")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Patch(":id/status")
  @setPermissions(Permissions.manageSales)
  @DocumentOperation(
    "Update invoice status",
    "Cashier may only update own invoices. COMPLETED deducts stock; REFUNDED restores stock and loyalty.",
  )
  @DocumentParam("id", "Invoice ID")
  @DocumentBody(UpdateSalesInvoiceStatusDto)
  @DocumentOkResponse("Invoice updated")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSalesInvoiceStatusDto,
    @ActiveUser("sub") userId: number,
    @ActiveUser("role") role: UserRole,
  ) {
    return this.salesService.updateStatus(id, dto, userId, role);
  }
}

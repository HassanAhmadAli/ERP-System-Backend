import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PurchaseService } from "./purchase.service";
import { CreatePurchaseInvoiceDto } from "./dto/create-purchase-invoice.dto";
import { UpdatePurchaseInvoiceStatusDto } from "./dto/update-purchase-invoice-status.dto";
import { PurchaseInvoiceQueryDto } from "./dto/purchase-invoice-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";

@ApiTags("Purchases")
@Controller("purchase/invoices")
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @setPermissions(Permissions.managePurchases)
  @ApiOperation({ summary: "Create a purchase invoice" })
  @ApiResponse({ status: 201, description: "Purchase invoice created successfully" })
  create(@ActiveUser("sub") userId: number, @Body() dto: CreatePurchaseInvoiceDto) {
    return this.purchaseService.create(userId, dto);
  }

  @Get()
  @setPermissions(Permissions.viewPurchases)
  @ApiOperation({ summary: "List purchase invoices" })
  @ApiResponse({ status: 200, description: "Purchase invoices retrieved successfully" })
  findAll(@Query() query: PurchaseInvoiceQueryDto) {
    return this.purchaseService.findAll(query);
  }

  @Get(":id")
  @setPermissions(Permissions.viewPurchases)
  @ApiOperation({ summary: "Get a purchase invoice by ID" })
  @ApiResponse({ status: 200, description: "Purchase invoice retrieved successfully" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.purchaseService.findOne(id);
  }

  @Patch(":id/status")
  @setPermissions(Permissions.managePurchases)
  @ApiOperation({ summary: "Update purchase invoice status" })
  @ApiResponse({ status: 200, description: "Purchase invoice status updated successfully" })
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePurchaseInvoiceStatusDto) {
    return this.purchaseService.updateStatus(id, dto);
  }
}

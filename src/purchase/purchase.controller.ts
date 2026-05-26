import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PurchaseService } from "./purchase.service";
import { CreatePurchaseInvoiceDto } from "./dto/create-purchase-invoice.dto";
import { UpdatePurchaseInvoiceStatusDto } from "./dto/update-purchase-invoice-status.dto";
import { PurchaseInvoiceQueryDto } from "./dto/purchase-invoice-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";

@ApiTags("Purchases")
@ApiAuth()
@Controller("purchase/invoices")
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @setPermissions(Permissions.managePurchases)
  @DocumentOperation("Create purchase invoice")
  @DocumentBody(CreatePurchaseInvoiceDto)
  @DocumentCreatedResponse("Purchase invoice created")
  create(@ActiveUser("sub") userId: number, @Body() dto: CreatePurchaseInvoiceDto) {
    return this.purchaseService.create(userId, dto);
  }

  @Get()
  @setPermissions(Permissions.viewPurchases)
  @DocumentOperation("List purchase invoices")
  @DocumentOkResponse("Paginated purchase invoices")
  findAll(@Query() query: PurchaseInvoiceQueryDto) {
    return this.purchaseService.findAll(query);
  }

  @Get(":id")
  @setPermissions(Permissions.viewPurchases)
  @DocumentOperation("Get purchase invoice by ID")
  @DocumentParam("id", "Purchase invoice ID")
  @DocumentOkResponse("Purchase invoice with items")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.purchaseService.findOne(id);
  }

  @Patch(":id/status")
  @setPermissions(Permissions.managePurchases)
  @DocumentOperation("Update purchase invoice status")
  @DocumentParam("id", "Purchase invoice ID")
  @DocumentBody(UpdatePurchaseInvoiceStatusDto)
  @DocumentOkResponse("Purchase invoice updated")
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePurchaseInvoiceStatusDto) {
    return this.purchaseService.updateStatus(id, dto);
  }
}

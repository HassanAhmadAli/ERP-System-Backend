import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OrderService } from "./order.service";
import { CreateOrderDto, CreateCashierOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
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

@ApiTags("Orders")
@ApiAuth()
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("customer")
  @setPermissions(Permissions.createCustomerOrder)
  @DocumentOperation("Create customer order", "Online order for the authenticated customer.")
  @DocumentBody(CreateOrderDto)
  @DocumentCreatedResponse("Order created")
  createCustomerOrder(@ActiveUser("sub") userId: number, @Body() dto: CreateOrderDto) {
    return this.orderService.createCustomerOrder(userId, dto);
  }

  @Post("cashier")
  @setPermissions(Permissions.createOrder)
  @DocumentOperation("Create order (cashier)", "In-store order on behalf of a customer.")
  @DocumentBody(CreateCashierOrderDto)
  @DocumentCreatedResponse("Order created")
  create(@Body() { customerId, ...dto }: CreateCashierOrderDto) {
    return this.orderService.createOrder(customerId, dto);
  }

  @Get("customer")
  @setPermissions(Permissions.viewCustomerPersonalOrders)
  @DocumentOperation("List own orders (customer)")
  @DocumentOkResponse("Paginated orders")
  findCustomerOrders(@ActiveUser("sub") userId: number, @Query() query: OrderQueryDto) {
    return this.orderService.findAll(userId, UserRole.CUSTOMER, query);
  }

  @Get("cashier")
  @setPermissions(Permissions.viewOrders)
  @DocumentOperation("List all orders (staff)")
  @DocumentOkResponse("Paginated orders")
  findAll(@ActiveUser("sub") userId: number, @Query() query: OrderQueryDto) {
    return this.orderService.findAll(userId, UserRole.CASHIER, query);
  }

  @Get("customer/:id")
  @setPermissions(Permissions.viewCustomerPersonalOrders)
  @DocumentOperation("Get own order by ID")
  @DocumentParam("id", "Order ID")
  @DocumentOkResponse("Order details")
  findOneForCustomer(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return this.orderService.findOne(id, userId, UserRole.CUSTOMER);
  }

  @Get("cashier/:id")
  @setPermissions(Permissions.viewOrders)
  @DocumentOperation("Get order by ID (staff)")
  @DocumentParam("id", "Order ID")
  @DocumentOkResponse("Order details")
  findOne(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return this.orderService.findOne(id, userId, UserRole.CASHIER);
  }

  @Patch("customer/:id/cancel")
  @setPermissions(Permissions.cancelOwnOrder)
  @DocumentOperation("Cancel own pending order")
  @DocumentParam("id", "Order ID")
  @DocumentOkResponse("Order cancelled")
  async cancelOwn(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return await this.orderService.cancelOwn(userId, id);
  }

  @Patch("cashier/:id/status")
  @setPermissions(Permissions.manageOrders)
  @DocumentOperation("Update order status", "Staff workflow: PREPARING → OUT_FOR_DELIVERY → DELIVERED.")
  @DocumentParam("id", "Order ID")
  @DocumentBody(UpdateOrderStatusDto)
  @DocumentOkResponse("Order updated")
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }
}

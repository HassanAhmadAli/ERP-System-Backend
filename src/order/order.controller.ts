import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OrderService } from "./order.service";
import { CreateOrderDto, CreateCashierOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { UserRole } from "@/prisma";
@ApiTags("Orders")
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("customer")
  @setPermissions(Permissions.createCustomerOrder)
  @ApiOperation({ summary: "Create a customer order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  createCustomerOrder(@ActiveUser("sub") userId: number, @Body() dto: CreateOrderDto) {
    return this.orderService.createCustomerOrder(userId, dto);
  }

  @Post("cashier")
  @setPermissions(Permissions.createOrder)
  @ApiOperation({ summary: "Create an order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  create(@Body() { customerId, ...dto }: CreateCashierOrderDto) {
    return this.orderService.createOrder(customerId, dto);
  }

  @Get("customer")
  @setPermissions(Permissions.viewCustomerPersonalOrders)
  @ApiOperation({ summary: "List own orders" })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  findCustomerOrders(@ActiveUser("sub") userId: number, @Query() query: OrderQueryDto) {
    return this.orderService.findAll(userId, UserRole.CUSTOMER, query);
  }

  @Get("cashier")
  @setPermissions(Permissions.viewOrders)
  @ApiOperation({ summary: "List all orders" })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  findAll(@ActiveUser("sub") userId: number, @Query() query: OrderQueryDto) {
    return this.orderService.findAll(userId, UserRole.CASHIER, query);
  }

  @Get("customer/:id")
  @setPermissions(Permissions.viewCustomerPersonalOrders)
  @ApiOperation({ summary: "Get an order by ID" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully" })
  findOneForCustomer(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return this.orderService.findOne(id, userId, UserRole.CUSTOMER);
  }

  @Get("cashier/:id")
  @setPermissions(Permissions.viewOrders)
  @ApiOperation({ summary: "Get an order by ID" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully" })
  findOne(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return this.orderService.findOne(id, userId, UserRole.CASHIER);
  }

  @Patch("customer/:id/cancel")
  @setPermissions(Permissions.cancelOwnOrder)
  @ApiOperation({ summary: "Cancel own pending order (customer)" })
  @ApiResponse({ status: 200, description: "Order cancelled successfully" })
  async cancelOwn(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return await this.orderService.cancelOwn(userId, id);
  }

  @Patch("cashier/:id/status")
  @setPermissions(Permissions.manageOrders)
  @ApiOperation({ summary: "Update order status" })
  @ApiResponse({ status: 200, description: "Order status updated successfully" })
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }
}

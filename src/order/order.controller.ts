import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
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

  @Post()
  @setPermissions(Permissions.createOrder)
  @ApiOperation({ summary: "Create an order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  create(@ActiveUser("sub") userId: number, @ActiveUser("role") role: UserRole, @Body() dto: CreateOrderDto) {
    return this.orderService.create(userId, role, dto);
  }

  @Get()
  @setPermissions(Permissions.viewOrders)
  @ApiOperation({ summary: "List orders (staff: all, customer: own)" })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  findAll(@ActiveUser("sub") userId: number, @ActiveUser("role") role: UserRole, @Query() query: OrderQueryDto) {
    return this.orderService.findAll(userId, role, query);
  }

  @Get(":id")
  @setPermissions(Permissions.viewOrders)
  @ApiOperation({ summary: "Get an order by ID" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully" })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @ActiveUser("sub") userId: number,
    @ActiveUser("role") role: UserRole,
  ) {
    return this.orderService.findOne(id, userId, role);
  }

  @Patch(":id/status")
  @setPermissions(Permissions.manageOrders)
  @ApiOperation({ summary: "Update order status" })
  @ApiResponse({ status: 200, description: "Order status updated successfully" })
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, ParseBoolPipe } from "@nestjs/common";
import { DiscountService } from "./discount.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { CalculateDiscountDto } from "./dto/calculate-discount.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Permissions } from "@/access-control/permission.type";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";

@ApiTags("Discounts")
@Controller("discount")
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @setPermissions(Permissions.manageDiscounts)
  @ApiOperation({ summary: "Create a new discount" })
  @ApiResponse({ status: 201, description: "Discount created successfully" })
  create(@ActiveUser("sub") userId: number, @Body() createDiscountDto: CreateDiscountDto) {
    return this.discountService.create(userId, createDiscountDto);
  }

  @Get()
  @setPermissions(Permissions.manageDiscounts)
  @ApiOperation({ summary: "Get all discounts with pagination and search" })
  @ApiResponse({ status: 200, description: "Discounts retrieved successfully" })
  findAll(@Query() paginationQuery: PaginationQueryDto, @Query("search") search?: string) {
    return this.discountService.findAll(paginationQuery, search);
  }

  @Get("active")
  @ApiOperation({ summary: "Get currently active and valid discounts" })
  @ApiResponse({ status: 200, description: "Active discounts retrieved successfully" })
  getActiveDiscounts(@Query() paginationQuery: PaginationQueryDto) {
    return this.discountService.getActiveDiscounts(paginationQuery);
  }

  @Get(":id")
  @setPermissions(Permissions.manageDiscounts)
  @ApiOperation({ summary: "Get a discount by ID" })
  @ApiResponse({ status: 200, description: "Discount retrieved successfully" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.discountService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageDiscounts)
  @ApiOperation({ summary: "Update a discount" })
  @ApiResponse({ status: 200, description: "Discount updated successfully" })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDiscountDto: UpdateDiscountDto) {
    return this.discountService.update(id, updateDiscountDto);
  }

  @Patch(":id/toggle")
  @setPermissions(Permissions.manageDiscounts)
  @ApiOperation({ summary: "Toggle a discount active/inactive" })
  @ApiResponse({ status: 200, description: "Discount toggled successfully" })
  toggleActive(@Param("id", ParseIntPipe) id: number, @Body("isActive", ParseBoolPipe) isActive: boolean) {
    return this.discountService.toggleActive(id, isActive);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageDiscounts)
  @ApiOperation({ summary: "Delete a discount" })
  @ApiResponse({ status: 200, description: "Discount deleted successfully" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.discountService.remove(id);
  }

  @Post("calculate")
  @ApiOperation({ summary: "Calculate the discount amount for a given subtotal" })
  @ApiResponse({ status: 200, description: "Discount calculation result" })
  calculateDiscount(@Body() calculateDiscountDto: CalculateDiscountDto) {
    return this.discountService.calculateDiscount(calculateDiscountDto);
  }

  @Post("best")
  @ApiOperation({ summary: "Find the best applicable discount for the given context" })
  @ApiResponse({ status: 200, description: "Best discount result or null" })
  getBestDiscount(@Body() calculateDiscountDto: CalculateDiscountDto) {
    return this.discountService.getBestDiscount(calculateDiscountDto.subtotal, {
      customerId: calculateDiscountDto.customerId,
      productId: calculateDiscountDto.productId,
      categoryId: calculateDiscountDto.categoryId,
    });
  }
}

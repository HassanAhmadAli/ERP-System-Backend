import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DiscountService } from "./discount.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { CalculateDiscountDto } from "./dto/calculate-discount.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { SearchQueryDto } from "@/common/dto/search-query.dto";
import { ToggleActiveDiscountDto } from "./dto/toggle-active.dto";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentOperation,
  DocumentParam,
} from "@/openapi/decorators";

@ApiTags("Discounts")
@ApiAuth()
@Controller("discount")
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @setPermissions(Permissions.manageDiscounts)
  @DocumentOperation("Create discount")
  @DocumentBody(CreateDiscountDto)
  @DocumentCreatedResponse("Discount created")
  create(@ActiveUser("sub") userId: number, @Body() createDiscountDto: CreateDiscountDto) {
    return this.discountService.create(userId, createDiscountDto);
  }

  @Get()
  @setPermissions(Permissions.manageDiscounts)
  @DocumentOperation("List discounts (staff)")
  @DocumentOkResponse("Paginated discounts")
  findAll(@Query() { search, ...paginationQuery }: SearchQueryDto) {
    return this.discountService.findAll(paginationQuery, search);
  }

  @Get("active")
  @DocumentOperation("List active discounts", "Valid for current date; usable by customers at checkout.")
  @DocumentOkResponse("Paginated active discounts")
  getActiveDiscounts(@Query() paginationQuery: PaginationQueryDto) {
    return this.discountService.getActiveDiscounts(paginationQuery);
  }

  @Get(":id")
  @setPermissions(Permissions.manageDiscounts)
  @DocumentOperation("Get discount by ID")
  @DocumentParam("id", "Discount ID")
  @DocumentOkResponse("Discount")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.discountService.findOne(id);
  }

  @Patch(":id")
  @setPermissions(Permissions.manageDiscounts)
  @DocumentOperation("Update discount")
  @DocumentParam("id", "Discount ID")
  @DocumentBody(UpdateDiscountDto)
  @DocumentOkResponse("Discount updated")
  update(@Param("id", ParseIntPipe) id: number, @Body() updateDiscountDto: UpdateDiscountDto) {
    return this.discountService.update(id, updateDiscountDto);
  }

  @Patch(":id/toggle")
  @setPermissions(Permissions.manageDiscounts)
  @DocumentOperation("Toggle discount active flag")
  @DocumentParam("id", "Discount ID")
  @DocumentBody(ToggleActiveDiscountDto)
  @DocumentOkResponse("Discount toggled")
  toggleActive(@Param("id", ParseIntPipe) id: number, @Body() { isActive }: ToggleActiveDiscountDto) {
    return this.discountService.toggleActive(id, isActive);
  }

  @Delete(":id")
  @setPermissions(Permissions.manageDiscounts)
  @DocumentOperation("Delete discount")
  @DocumentParam("id", "Discount ID")
  @DocumentOkResponse("Discount deleted")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.discountService.remove(id);
  }

  @Post("calculate")
  @DocumentOperation("Calculate discount amount", "POS/checkout helper for a known discountId.")
  @DocumentBody(CalculateDiscountDto)
  @DocumentOkResponse("Discount calculation result")
  calculateDiscount(@Body() calculateDiscountDto: CalculateDiscountDto) {
    return this.discountService.calculateDiscount(calculateDiscountDto);
  }

  @Post("best")
  @DocumentOperation("Find best applicable discount", "Evaluates scope rules for customer/product/category.")
  @DocumentBody(CalculateDiscountDto)
  @DocumentOkResponse("Best discount or null")
  getBestDiscount(@Body() calculateDiscountDto: CalculateDiscountDto) {
    return this.discountService.getBestDiscount(calculateDiscountDto.subtotal, {
      customerId: calculateDiscountDto.customerId,
      productId: calculateDiscountDto.productId,
      categoryId: calculateDiscountDto.categoryId,
    });
  }
}

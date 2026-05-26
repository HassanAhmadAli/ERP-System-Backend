import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FinancialService } from "./financial.service";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { FinancialDateRangeDto } from "./dto/financial-date-range.dto";
import { CostTrendsQueryDto } from "./dto/cost-trends-query.dto";
import { SupplierReportQueryDto } from "./dto/supplier-report-query.dto";
import { RecalculateCostsDto } from "./dto/recalculate-costs-dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { ApiAuth, DocumentBody, DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";

@ApiTags("Financial")
@ApiAuth()
@Controller("financial")
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get("profit-margins")
  @setPermissions(Permissions.viewFinancials)
  @DocumentOperation("Profit margins per product")
  @DocumentOkResponse("Paginated profit margins")
  getProfitMargins(@Query() query: PaginationQueryDto) {
    return this.financialService.getProfitMargins(query);
  }

  @Get("cost-breakdown")
  @setPermissions(Permissions.viewFinancials)
  @DocumentOperation("Cost breakdown", "Purchases, expenses, and discounts in a date range.")
  @DocumentOkResponse("Cost breakdown")
  getCostBreakdown(@Query() query: FinancialDateRangeDto) {
    return this.financialService.getCostBreakdown(query);
  }

  @Get("cost-trends")
  @setPermissions(Permissions.viewFinancials)
  @DocumentOperation("Product cost trends over time")
  @DocumentOkResponse("Cost trends")
  getCostTrends(@Query() query: CostTrendsQueryDto) {
    return this.financialService.getCostTrends(query);
  }

  @Post("recalculate-costs")
  @setPermissions(Permissions.manageFinancials)
  @DocumentOperation("Recalculate product costs", "Uses latest purchase prices for given product IDs.")
  @DocumentBody(RecalculateCostsDto)
  @DocumentOkResponse("Recalculation result")
  recalculateCosts(@Body() body: RecalculateCostsDto) {
    return this.financialService.recalculateCosts(body.productIds);
  }

  @Get("supplier-report")
  @setPermissions(Permissions.viewFinancials)
  @DocumentOperation("Supplier purchase report")
  @DocumentOkResponse("Supplier report")
  getSupplierReport(@Query() query: SupplierReportQueryDto) {
    return this.financialService.getSupplierReport(query);
  }
}

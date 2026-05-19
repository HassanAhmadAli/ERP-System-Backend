import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { FinancialService } from "./financial.service";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { FinancialDateRangeDto } from "./dto/financial-date-range.dto";
import { CostTrendsQueryDto } from "./dto/cost-trends-query.dto";
import { SupplierReportQueryDto } from "./dto/supplier-report-query.dto";
import { RecalculateCostsDto } from "./dto/recalculate-costs-dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

@ApiTags("Financial")
@Controller("financial")
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get("profit-margins")
  @setPermissions(Permissions.viewFinancials)
  @ApiOperation({ summary: "Profit margins per product" })
  getProfitMargins(@Query() query: PaginationQueryDto) {
    return this.financialService.getProfitMargins(query);
  }

  @Get("cost-breakdown")
  @setPermissions(Permissions.viewFinancials)
  @ApiOperation({ summary: "Cost breakdown (purchases, expenses, discounts)" })
  getCostBreakdown(@Query() query: FinancialDateRangeDto) {
    return this.financialService.getCostBreakdown(query);
  }

  @Get("cost-trends")
  @setPermissions(Permissions.viewFinancials)
  @ApiOperation({ summary: "Product cost trends over time" })
  getCostTrends(@Query() query: CostTrendsQueryDto) {
    return this.financialService.getCostTrends(query);
  }

  @Post("recalculate-costs")
  @setPermissions(Permissions.manageFinancials)
  @ApiOperation({ summary: "Recalculate product costs from latest purchases" })
  recalculateCosts(@Body() body: RecalculateCostsDto) {
    return this.financialService.recalculateCosts(body.productIds);
  }

  @Get("supplier-report")
  @setPermissions(Permissions.viewFinancials)
  @ApiOperation({ summary: "Supplier purchase report" })
  getSupplierReport(@Query() query: SupplierReportQueryDto) {
    return this.financialService.getSupplierReport(query);
  }
}

import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ReportService } from "./report.service";
import { ReportSummaryQueryDto } from "./dto/report-summary-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";

@ApiTags("Reports")
@Controller("reports")
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get("summary")
  @setPermissions(Permissions.viewReports)
  @ApiOperation({ summary: "Dashboard summary (revenue, expenses, top products)" })
  @ApiResponse({ status: 200, description: "Report summary retrieved successfully" })
  getSummary(@Query() query: ReportSummaryQueryDto) {
    return this.reportService.getSummary(query);
  }
}

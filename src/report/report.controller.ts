import { Controller, Get, Query, StreamableFile } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ReportService } from "./report.service";
import { ReportExportService } from "./report-export.service";
import { ReportSummaryQueryDto } from "./dto/report-summary-query.dto";
import { ReportExportQueryDto } from "./dto/report-export-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";

@ApiTags("Reports")
@Controller("reports")
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportExportService: ReportExportService,
  ) {}

  @Get("summary")
  @setPermissions(Permissions.viewReports)
  @ApiOperation({ summary: "Dashboard summary (revenue, expenses, top products)" })
  @ApiResponse({ status: 200, description: "Report summary retrieved successfully" })
  getSummary(@Query() query: ReportSummaryQueryDto) {
    return this.reportService.getSummary(query);
  }

  @Get("dashboard")
  @setPermissions(Permissions.viewReports)
  @ApiOperation({ summary: "Today dashboard snapshot (low stock, sales today, pending orders)" })
  @ApiResponse({ status: 200, description: "Dashboard metrics retrieved successfully" })
  getDashboard() {
    return this.reportService.getDashboard();
  }

  @Get("inventory")
  @setPermissions(Permissions.viewReports)
  @ApiOperation({ summary: "Inventory status report" })
  getInventory() {
    return this.reportService.getInventoryReport();
  }

  @Get("export")
  @setPermissions(Permissions.exportReports)
  @ApiOperation({ summary: "Export report as CSV, Excel, or PDF" })
  async exportReport(@Query() { type: reportType, ...query }: ReportExportQueryDto) {
    const { buffer, contentType, filename } = await this.reportExportService.export(reportType, query);
    return new StreamableFile(buffer, {
      type: contentType,
      disposition: `attachment; filename="${filename}"`,
    });
  }
}

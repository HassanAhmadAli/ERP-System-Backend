import { Controller, Get, Query, StreamableFile } from "@nestjs/common";
import { ApiProduces, ApiTags } from "@nestjs/swagger";
import { ReportService } from "./report.service";
import { ReportExportService } from "./report-export.service";
import { ReportSummaryQueryDto } from "./dto/report-summary-query.dto";
import { ReportExportQueryDto } from "./dto/report-export-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ApiAuth, DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";

@ApiTags("Reports")
@ApiAuth()
@Controller("reports")
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportExportService: ReportExportService,
  ) {}

  @Get("summary")
  @setPermissions(Permissions.viewReports)
  @DocumentOperation("Report summary", "Revenue, expenses, profit, top products for a date range.")
  @DocumentOkResponse("Summary metrics")
  getSummary(@Query() query: ReportSummaryQueryDto) {
    return this.reportService.getSummary(query);
  }

  @Get("dashboard")
  @setPermissions(Permissions.viewReports)
  @DocumentOperation("Today's dashboard", "Low stock, sales today, pending orders.")
  @DocumentOkResponse("Dashboard snapshot")
  getDashboard() {
    return this.reportService.getDashboard();
  }

  @Get("inventory")
  @setPermissions(Permissions.viewReports)
  @DocumentOperation("Inventory status report")
  @DocumentOkResponse("Inventory report")
  getInventory() {
    return this.reportService.getInventoryReport();
  }

  @Get("export")
  @setPermissions(Permissions.viewReports)
  @DocumentOperation("Export report file", "Types: summary, inventory, sales, purchases, profit-margins.")
  @ApiProduces("text/csv", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @DocumentOkResponse("CSV/PDF/Excel file download")
  async exportReport(@Query() { type: reportType, ...query }: ReportExportQueryDto) {
    const { buffer, contentType, filename } = await this.reportExportService.export(reportType, query);
    return new StreamableFile(buffer, {
      type: contentType,
      disposition: `attachment; filename="${filename}"`,
    });
  }
}

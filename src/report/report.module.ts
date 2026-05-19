import { Module } from "@nestjs/common";
import { ReportService } from "./report.service";
import { ReportExportService } from "./report-export.service";
import { ReportController } from "./report.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { FinancialModule } from "@/financial/financial.module";

@Module({
  imports: [PrismaModule, FinancialModule],
  controllers: [ReportController],
  providers: [ReportService, ReportExportService],
  exports: [ReportService, ReportExportService],
})
export class ReportModule {}

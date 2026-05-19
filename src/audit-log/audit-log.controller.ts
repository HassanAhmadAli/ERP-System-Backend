import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuditLogService } from "./audit-log.service";
import { AuditLogQueryDto } from "./dto/audit-log-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";

@ApiTags("Audit Logs")
@Controller("audit-logs")
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @setPermissions(Permissions.viewAuditLogs)
  @ApiOperation({ summary: "List audit logs (admin)" })
  @ApiResponse({ status: 200, description: "Audit logs retrieved successfully" })
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogService.findAll(query);
  }
}

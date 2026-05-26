import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuditLogService } from "./audit-log.service";
import { AuditLogQueryDto } from "./dto/audit-log-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ApiAuth, DocumentOkResponse, DocumentOperation } from "@/openapi/decorators";

@ApiTags("Audit Logs")
@ApiAuth()
@Controller("audit-logs")
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @setPermissions(Permissions.viewAuditLogs)
  @DocumentOperation("List audit logs", "Filter by user, entity, action, and date range.")
  @DocumentOkResponse("Paginated audit logs")
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogService.findAll(query);
  }
}

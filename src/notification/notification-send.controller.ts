import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationSendService } from "./notification-send.service";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationSendController {
  constructor(private readonly notificationSendService: NotificationSendService) {}

  @Post("send")
  @setPermissions(Permissions.sendNotifications)
  @ApiOperation({ summary: "Send notification to customers or staff" })
  send(@ActiveUser("sub") senderId: number, @Body() dto: SendNotificationDto) {
    return this.notificationSendService.send(senderId, dto);
  }

  @Get("history")
  @setPermissions(Permissions.viewNotificationHistory)
  @ApiOperation({ summary: "List sent notification history" })
  history(@Query() query: PaginationQueryDto) {
    return this.notificationSendService.getHistory(query);
  }
}

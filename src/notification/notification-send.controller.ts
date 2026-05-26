import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NotificationSendService } from "./notification-send.service";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { setPermissions } from "@/access-control/decorators/permissions.decorator";
import { Permissions } from "@/access-control/permission.type";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import {
  ApiAuth,
  DocumentBody,
  DocumentCreatedResponse,
  DocumentOkResponse,
  DocumentOperation,
} from "@/openapi/decorators";

@ApiTags("Notifications")
@ApiAuth()
@Controller("notifications")
export class NotificationSendController {
  constructor(private readonly notificationSendService: NotificationSendService) {}

  @Post("send")
  @setPermissions(Permissions.sendNotifications)
  @DocumentOperation("Send internal notification", "Target ALL, ROLE, or specific USER ids.")
  @DocumentBody(SendNotificationDto)
  @DocumentCreatedResponse("Notification sent")
  send(@ActiveUser("sub") senderId: number, @Body() dto: SendNotificationDto) {
    return this.notificationSendService.send(senderId, dto);
  }

  @Get("history")
  @setPermissions(Permissions.viewNotificationHistory)
  @DocumentOperation("List sent notification history")
  @DocumentOkResponse("Paginated sent notifications")
  history(@Query() query: PaginationQueryDto) {
    return this.notificationSendService.getHistory(query);
  }
}

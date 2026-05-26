import { Controller, Get, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NotificationInboxService } from "./notification-inbox.service";
import { NotificationInboxQueryDto } from "./dto/notification-inbox-query.dto";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { ApiAuth, DocumentOkResponse, DocumentOperation, DocumentParam } from "@/openapi/decorators";

@ApiTags("Notifications")
@ApiAuth()
@Controller("notifications")
export class NotificationInboxController {
  constructor(private readonly notificationInboxService: NotificationInboxService) {}

  @Get("me")
  @DocumentOperation("List my notifications", "In-app inbox for the authenticated user.")
  @DocumentOkResponse("Paginated notifications")
  findMine(@ActiveUser("sub") userId: number, @Query() query: NotificationInboxQueryDto) {
    return this.notificationInboxService.findMine(userId, query);
  }

  @Patch(":id/read")
  @DocumentOperation("Mark notification as read")
  @DocumentParam("id", "Notification ID")
  @DocumentOkResponse("Notification marked read")
  markRead(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return this.notificationInboxService.markRead(id, userId);
  }

  @Patch(":id/unread")
  @DocumentOperation("Mark notification as unread")
  @DocumentParam("id", "Notification ID")
  @DocumentOkResponse("Notification marked unread")
  markUnRead(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return this.notificationInboxService.markUnRead(id, userId);
  }
}

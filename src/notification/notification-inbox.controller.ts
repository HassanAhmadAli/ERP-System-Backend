import { Controller, Get, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NotificationInboxService } from "./notification-inbox.service";
import { NotificationInboxQueryDto } from "./dto/notification-inbox-query.dto";
import { ActiveUser } from "@/common/decorators/ActiveUser.decorator";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationInboxController {
  constructor(private readonly notificationInboxService: NotificationInboxService) {}

  @Get("me")
  @ApiOperation({ summary: "List in-app notifications for the current user" })
  @ApiResponse({ status: 200, description: "Notifications retrieved successfully" })
  findMine(@ActiveUser("sub") userId: number, @Query() query: NotificationInboxQueryDto) {
    return this.notificationInboxService.findMine(userId, query);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  markRead(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return this.notificationInboxService.markRead(id, userId);
  }

  @Patch(":id/unread")
  @ApiOperation({ summary: "Mark a notification as unread" })
  markUnRead(@Param("id", ParseIntPipe) id: number, @ActiveUser("sub") userId: number) {
    return this.notificationInboxService.markUnRead(id, userId);
  }
}

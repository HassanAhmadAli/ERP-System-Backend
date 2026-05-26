import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { paginated } from "@/common/types/paginated-response";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { NotificationTargetType, UserRole } from "@/prisma";
import { NotificationsService } from "./notification.service";
import { Notification } from "./notification.interface";
@Injectable()
export class NotificationSendService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async send(senderId: number, dto: SendNotificationDto) {
    const recipientUserIds = await this.resolveRecipients(dto);

    if (recipientUserIds.length === 0) {
      throw new BadRequestException("No recipients matched the target criteria");
    }
    const now = new Date();

    const { recipients, ...notification } = await this.prisma.notification.create({
      data: {
        senderId,
        title: dto.title,
        body: dto.body,
        targetType: dto.targetType,
        targetRole: dto.targetRole,
        recipients: {
          create: recipientUserIds.map((userId) => ({ userId })),
        },
      },
      include: {
        sender: { select: { id: true, fullName: true } },
        recipients: { select: { id: true, userId: true, user: { select: { email: true } } } },
      },
    });
    const res = { ...notification, recipientCount: recipients.length };

    const notifications = recipients.map((recipient): Notification => {
      return {
        createdAt: now,
        email: recipient.user.email,
        message: dto.body,
        title: dto.title,
        type: "info",
        userId: recipient.userId,
      };
    });
    await this.notificationsService.addNotifications(notifications, "send-notification");
    return res;
  }

  async getHistory(query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        include: {
          sender: { select: { id: true, fullName: true, email: true } },
          _count: { select: { recipients: true } },
        },
        skip: query.offset,
        take: query.limit,
        orderBy: { sentAt: "desc" },
      }),
      this.prisma.notification.count(),
    ]);

    return paginated(
      data.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        targetType: n.targetType,
        targetRole: n.targetRole,
        sentAt: n.sentAt,
        sender: n.sender,
        recipientCount: n._count.recipients,
      })),
      total,
      query.limit,
      query.offset,
    );
  }

  private async resolveRecipients(dto: SendNotificationDto): Promise<number[]> {
    switch (dto.targetType) {
      case NotificationTargetType.ALL: {
        const users = await this.prisma.user.findMany({
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }
      case NotificationTargetType.ROLE: {
        const role = dto.targetRole as UserRole;
        const users = await this.prisma.user.findMany({
          where: { role, isActive: true, deletedAt: null },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }
      case NotificationTargetType.USER: {
        const users = await this.prisma.user.findMany({
          where: { id: { in: dto.userIds! }, isActive: true, deletedAt: null },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }
      default:
        return [];
    }
  }
}

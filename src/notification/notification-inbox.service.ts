import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { NotificationInboxQueryDto } from "./dto/notification-inbox-query.dto";
import { paginated } from "@/common/types/paginated-response";
import { Prisma } from "@/prisma";

@Injectable()
export class NotificationInboxService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async findMine(userId: number, query: NotificationInboxQueryDto) {
    const where: Prisma.NotificationRecipientWhereInput = { userId };

    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [data, total] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where,
        include: {
          notification: {
            include: {
              sender: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
        skip: query.offset,
        take: query.limit,
        orderBy: { notification: { sentAt: "desc" } },
      }),
      this.prisma.notificationRecipient.count({ where }),
    ]);

    return paginated(data, total, query.limit, query.offset);
  }

  async markRead(recipientId: number, userId: number) {
    await this.prisma.notificationRecipient.findFirstOrThrow({
      where: { id: recipientId, userId },
    });

    return this.prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: { isRead: true, readAt: new Date() },
      include: { notification: true },
    });
  }
  async markUnRead(recipientId: number, userId: number) {
    await this.prisma.notificationRecipient.findFirstOrThrow({
      where: { id: recipientId, userId },
    });

    return this.prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: { isRead: false, readAt: null },
      include: { notification: true },
    });
  }
}

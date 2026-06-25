import { Injectable } from "@nestjs/common";
import { Namespace, Socket } from "socket.io";
import { MessageBody } from "@nestjs/websockets";
import { PrismaService } from "@/prisma/prisma.service";
import { ActiveUserSchema } from "@/authentication/dto/request-user.dto";
import { AppCachingService } from "@/caching/caching.service";
import { NotificationConsumer } from "./notification.consumer";
import { HashingService } from "@/hashing/hashing.service";
import { InjectQueue } from "@nestjs/bullmq";
import { Keys } from "@/common/const";
import { Queue } from "bullmq";
import { Notification } from "./notification.interface";

@Injectable()
export class NotificationsService {
  namespace!: Namespace;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly cachingService: AppCachingService,
    private readonly notificationConsumer: NotificationConsumer,
    @InjectQueue(Keys.notification) private readonly notificationQueue: Queue<Notification>,
  ) {}
  get prisma() {
    return this.prismaService.client;
  }
  setNamespace(namespace: Namespace) {
    this.namespace = namespace;
    this.notificationConsumer.setNamespace(namespace);
  }

  async handleLogin(client: Socket, @MessageBody() access_token: string) {
    const decoded = this.hashingService.verifyJwtToken(access_token);
    const user = ActiveUserSchema.parse(decoded);
    await this.cachingService.socketIo.checkSocketid(client.id);
    await this.cachingService.socketIo.registerSocket(client.id, user.sub);
    return {
      email: user.email,
      message: "Socketio Connection Established Successfully",
    };
  }

  async handleDisconnect(client: Socket) {
    client.disconnect();
    await this.cachingService.socketIo.unRegisterSocket(client.id);
  }
  async addNotification(notification: Notification, name: string) {
    return await this.notificationQueue.add(name, notification);
  }
  async addNotifications(notifications: Notification[], name: string) {
    const jobs = notifications.map((notification) => ({
      name: name,
      data: notification,
    }));

    return await this.notificationQueue.addBulk(jobs);
  }
}

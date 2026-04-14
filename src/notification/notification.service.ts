import { Injectable } from "@nestjs/common";
import { Namespace, Socket } from "socket.io";
import { MessageBody } from "@nestjs/websockets";
import { PrismaService } from "@/prisma";
import { JwtService } from "@nestjs/jwt";
import { ActiveUserSchema } from "@/iam/authentication/dto/request-user.dto";
import { CachingService } from "@/common/caching/caching.service";
import { NotificationConsumer } from "./notification.consumer";

@Injectable()
export class NotificationsService {
  namespace!: Namespace;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly cachingService: CachingService,
    private readonly notificationConsumer: NotificationConsumer,
  ) {}
  get prisma() {
    return this.prismaService.client;
  }
  setNamespace(namespace: Namespace) {
    this.namespace = namespace;
    this.notificationConsumer.setNamespace(namespace);
  }

  async handleLogin(client: Socket, @MessageBody() accessToken: string) {
    const decoded = (await this.jwtService.verifyAsync(accessToken)) as unknown;
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
}

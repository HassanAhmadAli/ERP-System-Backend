import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  WebSocketServer,
} from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { NotificationsService } from "./notifications.service";
import { logger } from "@/utils";
import { UseStandardGatewaySetup } from "@/common/decorators/standard-gateway.decorator";

@UseStandardGatewaySetup()
@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/notifications",
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(private readonly notificationsService: NotificationsService) {}
  @WebSocketServer()
  protected namespace!: Namespace;

  afterInit(namespace: Namespace) {
    this.notificationsService.setNamespace(namespace);
  }

  handleConnection(client: Socket) {
    logger.info(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    return this.notificationsService.handleDisconnect(client);
  }

  @SubscribeMessage("login")
  async handleLogin(@ConnectedSocket() socket: Socket, @MessageBody() accessToken: string) {
    return await this.notificationsService.handleLogin(socket, accessToken);
  }
}

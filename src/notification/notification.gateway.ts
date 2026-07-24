import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { NotificationsService } from "./notification.service";
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

  async handleConnection(client: Socket) {
    return this.notificationsService.handleConnection(client);
  }

  async handleDisconnect(client: Socket) {
    return this.notificationsService.handleDisconnect(client);
  }
}

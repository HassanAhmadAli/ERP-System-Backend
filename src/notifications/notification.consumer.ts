import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Keys } from "@/common/const";
import { Job } from "bullmq";
import { Namespace } from "socket.io";
import { Notification } from "./notification.interface";
import { CachingService } from "@/common/caching/caching.service";
import { MailerService } from "@nestjs-modules/mailer";
@Processor(Keys.notification)
export class NotificationConsumer extends WorkerHost {
  constructor(
    private readonly cacheService: CachingService,
    private readonly mailingService: MailerService,
  ) {
    super();
  }
  namespace!: Namespace;
  setNamespace(namespace: Namespace) {
    this.namespace = namespace;
  }
  override async process(job: Job<Notification, object, string>) {
    const socketId = await this.cacheService.socketIo.getSocketid(job.data.userId);
    const client = this.namespace.sockets.get(socketId);
    if (client != undefined) {
      client.emit("recieve-message", job.data);
      if (job.data.type !== "security") return;
    }
    if (job.data.email != null)
      await this.mailingService.sendMail({
        to: job.data.email,
        subject: job.data.title,
        text: job.data.message,
      });
  }
}

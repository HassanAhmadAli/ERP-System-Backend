import { Module } from "@nestjs/common";
import { ComplaintsService } from "./complaints.service";
import { ComplaintsController } from "./complaints.controller";
import { CommonModule } from "@/common/common.module";
import { NotificationsModule } from "@/notifications/notifications.module";

@Module({
  imports: [CommonModule, NotificationsModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
})
export class ComplaintsModule {}

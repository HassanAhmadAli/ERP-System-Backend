import { Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { DiscountModule } from "@/discount/discount.module";
import { NotificationsModule } from "@/notification/notification.module";

@Module({
  imports: [PrismaModule, DiscountModule, NotificationsModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

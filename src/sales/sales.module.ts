import { Module } from "@nestjs/common";
import { SalesService } from "./sales.service";
import { SalesController } from "./sales.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { DiscountModule } from "@/discount/discount.module";
import { NotificationsModule } from "@/notification/notification.module";

@Module({
  imports: [PrismaModule, DiscountModule, NotificationsModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}

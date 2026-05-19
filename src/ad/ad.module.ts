import { Module } from "@nestjs/common";
import { AdController } from "./ad.controller";
import { AdService } from "./ad.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AdController],
  providers: [AdService],
  exports: [AdService],
})
export class AdModule {}

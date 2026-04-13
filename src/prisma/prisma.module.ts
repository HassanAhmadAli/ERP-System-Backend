import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { APP_FILTER } from "@nestjs/core";
import { PrismaServerErrorFilter } from "./filter/prisma-error.filter";
@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: PrismaServerErrorFilter,
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}

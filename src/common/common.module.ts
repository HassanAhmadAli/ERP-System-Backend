import { Global, Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ZodErrorFilter } from "./filter/zod-error.filter";
import { HttpExceptionFilter } from "./filter/http-exception.filter";
import { MulterModule } from "@nestjs/platform-express";
import { CachingService } from "./caching/caching.service";
@Global()
@Module({
  imports: [
    MulterModule.register({
      dest: "./uploads",
    }),
  ],
  exports: [MulterModule, CachingService],
  providers: [
    CachingService,
    {
      provide: APP_FILTER,
      useClass: ZodErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class CommonModule {}

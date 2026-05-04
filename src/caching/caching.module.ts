import { Module } from "@nestjs/common";
import { AppCachingService } from "./caching.service";
@Module({
  providers: [AppCachingService],
  exports: [AppCachingService],
})
export class CachingModule {}

import { Global, Module } from "@nestjs/common";
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
  providers: [CachingService],
})
export class CommonModule {}

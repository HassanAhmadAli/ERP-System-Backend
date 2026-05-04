import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { HashingModule } from "@/hashing/hashing.module";
import { CachingModule } from "@/caching/caching.module";

@Module({
  imports: [HashingModule, CachingModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { HashingModule } from "@/hashing/hashing.module";
import { CachingModule } from "@/caching/caching.module";
import { AuthenticationModule } from "@/authentication/authentication.module";

@Module({
  imports: [HashingModule, CachingModule, AuthenticationModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

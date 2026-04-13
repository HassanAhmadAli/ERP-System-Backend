import { Module } from "@nestjs/common";
import { HashingService } from "@/iam/hashing/hashing.service";
import { Argon2Service } from "@/iam/hashing/argon2.service";

@Module({
  providers: [
    {
      provide: HashingService,
      useClass: Argon2Service,
    },
  ],
  exports: [HashingService],
})
export class HashingModule {}

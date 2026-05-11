import { validateEnv } from "@/common/schema/env";
import { HashingModule } from "@/hashing/hashing.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    HashingModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => {
          return validateEnv(process.env);
        },
      ],
      validate: validateEnv,
    }),
  ],
})
export class SeedModule {}

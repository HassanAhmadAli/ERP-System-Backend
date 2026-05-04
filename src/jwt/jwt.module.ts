import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
@Module({
  providers: [],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVariables>) => {
        return {
          secret: config.get("JWT_SECRET", { infer: true }),
          signOptions: {
            audience: config.get("JWT_AUDIENCE", { infer: true }),
            issuer: config.get("JWT_ISSUER", { infer: true }),
            expiresIn: config.get("JWT_TTL", { infer: true }),
          },
          verifyOptions: {
            audience: config.get("JWT_AUDIENCE", { infer: true }),
            issuer: config.get("JWT_ISSUER", { infer: true }),
          },
        };
      },
    }),
  ],
  exports: [JwtModule],
})
export class AppJwtModule {}

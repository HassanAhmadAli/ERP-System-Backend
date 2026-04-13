import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { env } from "./common/env";
import { RedisIoAdapter } from "@/socketio/socketio";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: env!.ENABLE_Devtools,
    logger: ["debug", "error", "fatal", "log", "verbose", "warn"],
  });
  const config = app.get(ConfigService<EnvVariables>);
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(config.getOrThrow("REDIS_DATABASE_URL"));
  app.useWebSocketAdapter(redisIoAdapter);
  app.enableCors();
  app.enableShutdownHooks();
  await app.listen(config.getOrThrow("PORT", { infer: true }));
}
void bootstrap();

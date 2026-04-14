import { ZodValidationPipe, ZodSerializerInterceptor } from "nestjs-zod";
import { APP_PIPE, APP_INTERCEPTOR } from "@nestjs/core";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvVariables, validateEnv } from "@/common/schema/env";
import { CommonModule } from "@/common/common.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { TimeoutInterceptor } from "@/common/interceptors/timeout.interceptor";
import { IdentityAndAccessManagementModule } from "@/iam/iam.module";
import { DevtoolsModule } from "@nestjs/devtools-integration";
import { CacheModule } from "@nestjs/cache-manager";
import { UserModule } from "./user/user.module";
import { ComplaintsModule } from "./complaints/complaints.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { StatisticsModule } from "./statistics/statistics.module";
import { DepartmentModule } from "./department/department.module";
import KeyvRedis from "@keyv/redis";
import morgan from "morgan";
import { env } from "@/common/env";
import { CommentModule } from "./comment/comment.module";
import { AttachmentModule } from "./attachment/attachment.module";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bullmq";
import { CachingService } from "./common/caching/caching.service";
import { BackupModule } from "./backup/backup.module";
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: env!.REDIS_DATABASE_URL,
      },
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvVariables>) => ({
        ttl: 5 * 60 * 1000,
        stores: [
          new KeyvRedis(
            configService.getOrThrow("REDIS_DATABASE_URL", {
              infer: true,
            }),
            {},
          ),
        ],
      }),
    }),
    env!.ENABLE_Devtools
      ? DevtoolsModule.register({
          http: true,
        })
      : CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => {
          return validateEnv(process.env);
        },
      ],
      validate: validateEnv,
    }),
    CommonModule,
    PrismaModule,
    IdentityAndAccessManagementModule,
    UserModule,
    ComplaintsModule,
    NotificationsModule,
    StatisticsModule,
    DepartmentModule,
    CommentModule,
    AttachmentModule,
    BackupModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    CachingService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(morgan("dev")).forRoutes("*");
  }
}

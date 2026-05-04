import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { AppBaseExceptionFilter } from "./common/app_filter";
import { ZodErrorFilter } from "./common/filter/zod-error.filter";
import { HttpExceptionFilter } from "./common/filter/http-exception.filter";
import { JwtErrorFilter } from "./jwt/filter/jwt-error.filter";
import { PrismaServerErrorFilter } from "./prisma/filter/prisma-error.filter";
import { BaseExceptionFilter } from "@nestjs/core";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { logger } from "@/utils";

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  private strategies: AppBaseExceptionFilter[];
  constructor() {
    super();
    this.strategies = [
      new ZodErrorFilter(),
      new HttpExceptionFilter(),
      new JwtErrorFilter(),
      new PrismaServerErrorFilter(),
    ];
  }

  override catch(exception: Error, host: ArgumentsHost) {
    const strategy = this.strategies.find((s) => s.canHandle(exception));
    if (strategy) {
      exception = strategy.handle(exception);
    }
    if (host.getType() === "http") {
      return super.catch(exception, host);
    }
    if (host.getType() !== "ws") {
      throw new Error("using host type without specifiying how to handle it");
    }
    if (exception instanceof WsException) {
      return super.catch(exception, host);
    }
    const client = host.switchToWs().getClient<Socket>();
    if (exception instanceof HttpException) {
      try {
        return client.emit("exception", exception.getResponse());
      } catch {
        super.catch(exception, host);
      }
    }
    try {
      logger.error({ error: exception });
    } catch (loggingError) {
      console.error("CRITICAL: Logger failed. Original error message:", exception.message);
      console.error("Logging failed with:", (loggingError as Error).message);
    }
    try {
      return client.emit("exception", {
        statusCode: 500,
        message: exception.message,
      });
    } catch {
      // do nothing
    }
  }
}

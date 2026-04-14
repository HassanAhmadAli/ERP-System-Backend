import { HttpException } from "@nestjs/common";

export abstract class AppBaseExceptionFilter {
  abstract handle(exception: Error): HttpException;
  abstract canHandle(exception: Error): boolean;
}

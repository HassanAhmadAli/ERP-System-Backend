import { BadRequestException, HttpException } from "@nestjs/common";
import { ZodSerializationException, ZodValidationException } from "nestjs-zod";
import { prettifyError, ZodError } from "zod";
import { AppBaseExceptionFilter } from "../app_filter";

export class HttpExceptionFilter extends AppBaseExceptionFilter {
  constructor() {
    super();
  }
  override canHandle(exception: Error): boolean {
    return exception instanceof HttpException;
  }
  override handle(exception: HttpException) {
    if (exception instanceof ZodSerializationException || exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof ZodError) {
        exception = new BadRequestException(prettifyError(zodError));
      }
    }
    return exception;
  }
}

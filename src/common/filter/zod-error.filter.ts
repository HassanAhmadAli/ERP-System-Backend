import { prettifyError, ZodError } from "zod";
import { BadRequestException } from "@nestjs/common";
import { AppBaseExceptionFilter } from "../app_filter";

export class ZodErrorFilter extends AppBaseExceptionFilter {
  constructor() {
    super();
  }
  override canHandle(exception: Error): boolean {
    return exception instanceof ZodError;
  }

  override handle(exception: ZodError<unknown>) {
    return new BadRequestException(prettifyError(exception));
  }
}

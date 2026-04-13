import { ArgumentsHost, BadRequestException, Catch, HttpException } from "@nestjs/common";
import { ZodSerializationException, ZodValidationException } from "nestjs-zod";
import { prettifyError, ZodError } from "zod";
import { AppBaseExceptionFilter } from "../app_filter";

@Catch(HttpException)
export class HttpExceptionFilter extends AppBaseExceptionFilter {
  override catch(exception: HttpException, host: ArgumentsHost) {
    if (exception instanceof ZodSerializationException || exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof ZodError) {
        exception = new BadRequestException(prettifyError(zodError));
      }
    }
    return super.catch(exception, host);
  }
}

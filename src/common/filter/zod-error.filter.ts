import { prettifyError, ZodError } from "zod";
import { Catch, BadRequestException, ArgumentsHost } from "@nestjs/common";
import { AppBaseExceptionFilter } from "../app_filter";
@Catch(ZodError)
export class ZodErrorFilter extends AppBaseExceptionFilter {
  override catch(exception: ZodError<unknown>, host: ArgumentsHost) {
    const error = new BadRequestException(prettifyError(exception));
    return super.catch(error, host);
  }
}

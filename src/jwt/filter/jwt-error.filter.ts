import { AppBaseExceptionFilter } from "@/common/app_filter";
import { ErrorMessages } from "@/common/const";
import { UnauthorizedException } from "@nestjs/common";
import { JsonWebTokenError } from "@nestjs/jwt";

export class JwtErrorFilter extends AppBaseExceptionFilter {
  constructor() {
    super();
  }
  override canHandle(exception: Error): boolean {
    return exception instanceof JsonWebTokenError;
  }

  override handle(_exception: JsonWebTokenError) {
    return new UnauthorizedException(ErrorMessages.INVALID_TOKEN);
  }
}

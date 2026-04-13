import { AppBaseExceptionFilter } from "@/common/app_filter";
import { ErrorMessages } from "@/common/const";
import { ArgumentsHost, Catch, UnauthorizedException } from "@nestjs/common";
import { JsonWebTokenError } from "@nestjs/jwt";

@Catch(JsonWebTokenError)
export class JwtErrorFilter extends AppBaseExceptionFilter {
  override catch(_exception: JsonWebTokenError, host: ArgumentsHost) {
    const exception = new UnauthorizedException(ErrorMessages.INVALID_TOKEN);
    return super.catch(exception, host);
  }
}

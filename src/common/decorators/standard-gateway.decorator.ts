import { applyDecorators, UseFilters } from "@nestjs/common";
import { GlobalExceptionFilter } from "@/global-exception-filter";

export function UseStandardGatewaySetup() {
  return applyDecorators(UseFilters(GlobalExceptionFilter));
}

import { applyDecorators, UseFilters } from "@nestjs/common";
import { PrismaServerErrorFilter } from "@/prisma/filter/prisma-error.filter";
import { ZodErrorFilter } from "../filter/zod-error.filter";
import { HttpExceptionFilter } from "../filter/http-exception.filter";
import { JwtErrorFilter } from "@/iam/jwt/filter/jwt-error.filter";

export function UseStandardGatewaySetup() {
  return applyDecorators(UseFilters(PrismaServerErrorFilter, ZodErrorFilter, HttpExceptionFilter, JwtErrorFilter));
}

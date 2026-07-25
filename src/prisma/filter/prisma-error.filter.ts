import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/prisma/client";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations, I18nPath } from "@/i18n/generated/i18n.generated";
import { AppBaseExceptionFilter } from "@/common/app_filter";
import { logger } from "@/utils";

type HttpExceptionConstructor = new (message: string) => HttpException;

export class PrismaServerErrorFilter extends AppBaseExceptionFilter {
  constructor(private readonly i18n: I18nService<I18nTranslations>) {
    super();
  }

  override canHandle(exception: Error): boolean {
    return exception instanceof PrismaClientKnownRequestError;
  }

  override handle(
    error: PrismaClientKnownRequestError & {
      meta?: {
        driverAdapterError?: { cause?: { originalMessage?: string } };
        modelName?: string;
      };
    },
  ) {
    const originalMessage = error.meta?.driverAdapterError?.cause?.originalMessage;
    const tableContext = error.meta?.modelName ? ` on table [${error.meta?.modelName}]` : "";
    const args = { tableContext };
    const record = this.errorMap.get(error.code) || this.unkownErrorRecord;
    const [ExceptionClass, translationKey] = record;
    const msg = this.msg(translationKey, args, originalMessage);
    return new ExceptionClass(msg);
  }

  private msg(key: I18nPath, args: Record<string, string>, fallback: string | undefined) {
    logger.trace(args);
    const msg = this.i18n.t(key, { args });
    if (typeof msg === "string") {
      return msg;
    }
    if (fallback != undefined) {
      return fallback;
    }
    return "Prisma Validation Error";
  }
  private readonly unkownErrorRecord = [BadRequestException, "errors.prisma.unknownException"] as const;
  private readonly errorMap = new Map<string, [HttpExceptionConstructor, I18nPath]>([
    ["P2002", [ConflictException, "errors.prisma.uniqueConstraintFailed"]],
    ["P2003", [BadRequestException, "errors.prisma.foreignKeyFailed"]],
    ["P2006", [BadRequestException, "errors.prisma.invalidData"]],
    ["P2011", [BadRequestException, "errors.prisma.missingRequiredValue"]],
    ["P2014", [BadRequestException, "errors.prisma.relationViolation"]],
    ["P2022", [InternalServerErrorException, "errors.prisma.columnNotFound"]],
    ["P2025", [NotFoundException, "errors.prisma.recordNotFound"]],
  ]);
}

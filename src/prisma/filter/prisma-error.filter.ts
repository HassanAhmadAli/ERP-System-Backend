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
    const args = { context: tableContext };
    const record = this.errorMap.get(error.code) || this.unkownErrorRecord;
    const [ExceptionClass, translationKey] = record;
    const msg = this.msg(translationKey, args, originalMessage);
    return new ExceptionClass(msg);
  }

  private msg(key: I18nPath, args: Record<string, string>, fallback: string | undefined) {
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

  // private readonly fullerrorMap = new Map<string, [HttpExceptionConstructor, string]>([
  //   ["P1000", [InternalServerErrorException, "errors.prisma.authenticationFailed"]],
  //   ["P1001", [InternalServerErrorException, "errors.prisma.databaseUnreachable"]],
  //   ["P1002", [InternalServerErrorException, "errors.prisma.connectionTimeout"]],
  //   ["P1003", [InternalServerErrorException, "errors.prisma.databaseDoesNotExist"]],
  //   ["P1008", [InternalServerErrorException, "errors.prisma.operationTimeout"]],
  //   ["P1009", [ConflictException, "errors.prisma.databaseAlreadyExists"]],
  //   ["P1010", [InternalServerErrorException, "errors.prisma.accessDenied"]],
  //   ["P1011", [InternalServerErrorException, "errors.prisma.tlsConnectionError"]],
  //   ["P1016", [BadRequestException, "errors.prisma.incorrectParameters"]],
  //   ["P1017", [InternalServerErrorException, "errors.prisma.serverClosedConnection"]],
  //   ["P2000", [BadRequestException, "errors.prisma.valueTooLong"]],
  //   ["P2001", [NotFoundException, "errors.prisma.recordNotFound"]],
  //   ["P2002", [ConflictException, "errors.prisma.uniqueConstraintFailed"]],
  //   ["P2003", [BadRequestException, "errors.prisma.foreignKeyFailed"]],
  //   ["P2004", [BadRequestException, "errors.prisma.databaseConstraintFailed"]],
  //   ["P2005", [BadRequestException, "errors.prisma.invalidFieldValue"]],
  //   ["P2006", [BadRequestException, "errors.prisma.invalidData"]],
  //   ["P2007", [BadRequestException, "errors.prisma.dataValidationError"]],
  //   ["P2008", [BadRequestException, "errors.prisma.queryParsingError"]],
  //   ["P2009", [BadRequestException, "errors.prisma.queryValidationError"]],
  //   ["P2010", [InternalServerErrorException, "errors.prisma.rawQueryFailed"]],
  //   ["P2011", [BadRequestException, "errors.prisma.missingRequiredValue"]],
  //   ["P2012", [BadRequestException, "errors.prisma.missingRequiredValue"]],
  //   ["P2013", [BadRequestException, "errors.prisma.missingRequiredArgument"]],
  //   ["P2014", [BadRequestException, "errors.prisma.relationViolation"]],
  //   ["P2015", [NotFoundException, "errors.prisma.relatedRecordNotFound"]],
  //   ["P2016", [BadRequestException, "errors.prisma.queryInterpretationError"]],
  //   ["P2017", [BadRequestException, "errors.prisma.recordsNotConnected"]],
  //   ["P2018", [NotFoundException, "errors.prisma.connectedRecordsNotFound"]],
  //   ["P2019", [BadRequestException, "errors.prisma.inputError"]],
  //   ["P2020", [BadRequestException, "errors.prisma.valueOutOfRange"]],
  //   ["P2021", [NotFoundException, "errors.prisma.tableNotFound"]],
  //   ["P2022", [InternalServerErrorException, "errors.prisma.columnNotFound"]],
  //   ["P2023", [BadRequestException, "errors.prisma.inconsistentColumnData"]],
  //   ["P2024", [InternalServerErrorException, "errors.prisma.connectionPoolTimeout"]],
  //   ["P2025", [NotFoundException, "errors.prisma.recordNotFound"]],
  //   ["P2026", [BadRequestException, "errors.prisma.unsupportedFeature"]],
  //   ["P2027", [InternalServerErrorException, "errors.prisma.multipleDatabaseErrors"]],
  //   ["P2028", [InternalServerErrorException, "errors.prisma.transactionApiError"]],
  //   ["P2030", [BadRequestException, "errors.prisma.fulltextIndexNotFound"]],
  //   ["P2031", [InternalServerErrorException, "errors.prisma.mongoDBReplicaSetError"]],
  //   ["P2033", [BadRequestException, "errors.prisma.numberOutOfRange"]],
  //   ["P2034", [ConflictException, "errors.prisma.transactionConflict"]],
  // ]);
}

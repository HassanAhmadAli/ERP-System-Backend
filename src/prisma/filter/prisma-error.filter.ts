import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/prisma";
import { logger } from "@/utils";
import { AppBaseExceptionFilter } from "@/common/app_filter";

export class PrismaServerErrorFilter extends AppBaseExceptionFilter {
  constructor() {
    super();
  }
  override canHandle(exception: Error): boolean {
    return exception instanceof PrismaClientKnownRequestError;
  }

  override handle(
    error: PrismaClientKnownRequestError & {
      meta?: {
        driverAdapterError?: {
          cause?: {
            originalMessage?: string;
          };
        };
        modelName?: string;
      };
    },
  ) {
    const originalMessage = error.meta?.driverAdapterError?.cause?.originalMessage;
    let exception: HttpException | undefined = undefined;
    const tableContext = error.meta?.modelName ? ` on table [${error.meta?.modelName}]` : "";
    switch (error.code) {
      case "P2002": {
        exception = new ConflictException(originalMessage || `Database Unique Constraint Failed${tableContext}`);
        break;
      }
      case "P2003": {
        exception = new BadRequestException(originalMessage || `Foreign key constraint Failed${tableContext}`);
        break;
      }
      case "P2006": {
        exception = new BadRequestException(originalMessage || `Invalid data provided for Field${tableContext}`);
        break;
      }
      case "P2011": {
        exception = new BadRequestException(originalMessage || `Missing required value${tableContext}`);
        break;
      }
      case "P2014": {
        exception = new BadRequestException(
          originalMessage || `The requested change violates a required relation.${tableContext}`,
        );
        break;
      }
      case "P2022": {
        exception = new InternalServerErrorException(
          originalMessage || `column does not exist in the current database${tableContext}`,
        );
        break;
      }
      case "P2025": {
        const m = originalMessage || `Record not found${tableContext}`;
        exception = new NotFoundException(m);
        break;
      }
      default: {
        logger.error({
          caller: "PrismaServerErrorFilter",
          message: "unknown Exception",
          value: error,
        });
        if (exception == undefined) exception = new BadRequestException(originalMessage || `Prisma Validation Error`);
      }
    }
    return exception;
  }
}

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@/prisma";
import { logger } from "@/utils";
import { AppBaseExceptionFilter } from "@/common/app_filter";

@Catch(PrismaClientKnownRequestError)
export class PrismaServerErrorFilter extends AppBaseExceptionFilter {
  override catch(
    error: PrismaClientKnownRequestError & {
      meta: {
        driverAdapterError?: {
          cause?: {
            originalMessage?: string;
          };
        };
      };
    },
    host: ArgumentsHost,
  ) {
    const originalMessage = error.meta.driverAdapterError?.cause?.originalMessage;
    let exception: HttpException | undefined = undefined;
    switch (error.code) {
      case "P2002": {
        exception = new ConflictException(originalMessage || "Database Unique Constraint Failed");
        break;
      }
      case "P2003": {
        exception = new BadRequestException(originalMessage || "Foreign key constraint Failed");
        break;
      }
      case "P2006": {
        exception = new BadRequestException(originalMessage || "Invalid data provided for Field");
        break;
      }
      case "P2011": {
        exception = new BadRequestException(originalMessage || "Missing required value");
        break;
      }
      case "P2014": {
        exception = new BadRequestException(originalMessage || "The requested change violates a required relation.");
        break;
      }
      case "P2022": {
        exception = new InternalServerErrorException(
          originalMessage || "column does not exist in the current database",
        );
        break;
      }
      case "P2025": {
        exception = new NotFoundException(originalMessage || "Record not found");
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
    return super.catch(exception, host);
  }
}

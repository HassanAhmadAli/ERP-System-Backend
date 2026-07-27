/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { z } from "zod";
import { JsonWebTokenError } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { GlobalExceptionFilter } from "./global-exception-filter";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { PrismaClientKnownRequestError } from "@/prisma/client";

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;
  let baseCatchSpy: jest.SpyInstance;

  const httpHost = {
    getType: () => "http" as const,
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    switchToWs: () => {
      throw new Error("Unexpected WS access in HTTP host");
    },
    switchToRpc: () => {
      throw new Error("Unexpected RPC access in HTTP host");
    },
    getArgs: () => [],
  } as unknown as ArgumentsHost;

  const createWsHost = (socketClient: { emit: jest.Mock }): ArgumentsHost =>
    ({
      getType: () => "ws" as const,
      switchToWs: () => ({
        getClient: () => socketClient,
        getData: () => ({}),
      }),
      switchToHttp: () => {
        throw new Error("Unexpected HTTP access in WS host");
      },
      switchToRpc: () => {
        throw new Error("Unexpected RPC access in WS host");
      },
      getArgs: () => [],
    }) as unknown as ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => {
              if (key.startsWith("errors.prisma.")) {
                return "Prisma error";
              }
              if (key.startsWith("errors.auth.")) {
                return "Auth error";
              }
              return key;
            }),
          },
        },
      ],
    }).compile();

    filter = module.get(GlobalExceptionFilter);
    i18nService = module.get(I18nService);

    baseCatchSpy = jest.spyOn(BaseExceptionFilter.prototype, "catch").mockImplementation(jest.fn());
  });

  afterEach(() => {
    baseCatchSpy.mockRestore();
  });

  describe("HTTP context", () => {
    it("transforms ZodError to BadRequestException and delegates to BaseExceptionFilter", () => {
      const result = z.object({ email: z.string() }).safeParse({ email: 123 });
      if (!result.success) {
        filter.catch(result.error, httpHost);
      }

      expect(baseCatchSpy).toHaveBeenCalledWith(expect.any(BadRequestException), httpHost);
    });

    it("passes generic HttpException through unchanged", () => {
      const notFound = new NotFoundException("Resource not found");

      filter.catch(notFound, httpHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(notFound, httpHost);
    });

    it("transforms JsonWebTokenError to UnauthorizedException with i18n message", () => {
      const jwtError = new JsonWebTokenError("jwt malformed");

      filter.catch(jwtError, httpHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(expect.any(UnauthorizedException), httpHost);
      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.invalidToken");
    });

    it("transforms Prisma P2002 to ConflictException", () => {
      const prismaError = new PrismaClientKnownRequestError("Unique constraint failed on email", {
        code: "P2002",
        clientVersion: "5.22.0",
        meta: { modelName: "User" },
      });

      filter.catch(prismaError, httpHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(expect.any(ConflictException), httpHost);
      expect(i18nService.t).toHaveBeenCalledWith("errors.prisma.uniqueConstraintFailed", {
        args: { tableContext: " on table [User]" },
      });
    });

    it("transforms Prisma P2025 to NotFoundException", () => {
      const prismaError = new PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "5.22.0",
        meta: { modelName: "Order" },
      });

      filter.catch(prismaError, httpHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(expect.any(NotFoundException), httpHost);
      expect(i18nService.t).toHaveBeenCalledWith("errors.prisma.recordNotFound", {
        args: { tableContext: " on table [Order]" },
      });
    });

    it("transforms Prisma P2003 to BadRequestException", () => {
      const prismaError = new PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "5.22.0",
      });

      filter.catch(prismaError, httpHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(expect.any(BadRequestException), httpHost);
      expect(i18nService.t).toHaveBeenCalledWith("errors.prisma.foreignKeyFailed", {
        args: { tableContext: "" },
      });
    });

    it("transforms Prisma P2022 to InternalServerErrorException", () => {
      const prismaError = new PrismaClientKnownRequestError("Column not found", {
        code: "P2022",
        clientVersion: "5.22.0",
      });

      filter.catch(prismaError, httpHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(expect.any(InternalServerErrorException), httpHost);
      expect(i18nService.t).toHaveBeenCalledWith("errors.prisma.columnNotFound", {
        args: { tableContext: "" },
      });
    });

    it("transforms unknown Prisma error code to BadRequestException", () => {
      const prismaError = new PrismaClientKnownRequestError("Unknown error", {
        code: "P9999",
        clientVersion: "5.22.0",
        meta: { modelName: "Test" },
      });

      filter.catch(prismaError, httpHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(expect.any(BadRequestException), httpHost);
      expect(i18nService.t).toHaveBeenCalledWith("errors.prisma.unknownException", {
        args: { tableContext: " on table [Test]" },
      });
    });

    it("passes unhandled Error through to BaseExceptionFilter unchanged", () => {
      const error = new Error("Something unexpected happened");

      filter.catch(error, httpHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(error, httpHost);
    });
  });

  describe("WebSocket context", () => {
    it("delegates WsException to BaseExceptionFilter", () => {
      const mockSocket = { emit: jest.fn() };
      const wsHost = createWsHost(mockSocket);
      const wsException = new WsException("WebSocket error");

      filter.catch(wsException, wsHost);

      expect(baseCatchSpy).toHaveBeenCalledWith(wsException, wsHost);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it("emits HttpException response to the client", () => {
      const mockSocket = { emit: jest.fn() };
      const wsHost = createWsHost(mockSocket);
      const badRequest = new BadRequestException("Invalid input");

      filter.catch(badRequest, wsHost);

      expect(mockSocket.emit).toHaveBeenCalledWith("exception", badRequest.getResponse());
      expect(baseCatchSpy).not.toHaveBeenCalled();
    });

    it("emits generic error as 500 response to the client", () => {
      const mockSocket = { emit: jest.fn() };
      const wsHost = createWsHost(mockSocket);
      const error = new Error("Internal WS failure");

      filter.catch(error, wsHost);

      expect(mockSocket.emit).toHaveBeenCalledWith("exception", {
        statusCode: 500,
        message: "Internal WS failure",
      });
    });
  });

  describe("edge cases", () => {
    it("throws an error for unknown host type", () => {
      const unknownHost = {
        getType: () => "rpc" as const,
        switchToHttp: () => {
          throw new Error("Unexpected HTTP access");
        },
        switchToWs: () => {
          throw new Error("Unexpected WS access");
        },
        switchToRpc: () => {
          throw new Error("Unexpected RPC access");
        },
        getArgs: () => [],
      } as Partial<ArgumentsHost> as ArgumentsHost;

      expect(() => filter.catch(new Error("test"), unknownHost)).toThrow(
        "using host type without specifiying how to handle it",
      );
    });
  });
});

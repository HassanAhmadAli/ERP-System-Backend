import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JsonWebTokenError } from "@nestjs/jwt";
import { AuthenticationGuard } from "./authentication.guard";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "../../i18n/generated/i18n.generated";
import { Keys } from "../../common/const";

describe("AuthenticationGuard", () => {
  let guard: AuthenticationGuard;
  let reflector: jest.Mocked<Reflector>;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  const mockExecutionContext = (): jest.Mocked<ExecutionContext> => {
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as jest.Mocked<ExecutionContext>;
    return context;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => {
              if (key === "errors.auth.invalidToken") return "Invalid token";
              if (key === "errors.auth.accessTokenNotProvided") return "Access token not provided";
              return key;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthenticationGuard>(AuthenticationGuard);
    reflector = module.get(Reflector);
    i18nService = module.get(I18nService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("canActivate", () => {
    it("canActivate_publicRoute_returnsTrue", async () => {
      const context = mockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(Keys.IsPublic, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it("canActivate_nonPublicRoute_validatesJwt", async () => {
      const context = mockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const parentCanActivateSpy = jest
        .spyOn(AuthenticationGuard.prototype as any, "canActivate")
        .mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      parentCanActivateSpy.mockRestore();
    });
  });

  describe("handleRequest", () => {
    it("handleRequest_errorPresent_throwsError", () => {
      const error = new Error("Authentication failed");

      expect(() => {
        guard.handleRequest(error, false, null, {} as any);
      }).toThrow(error);
    });

    it("handleRequest_noUserWithJwtError_throwsInvalidToken", () => {
      const jwtError = new JsonWebTokenError("jwt malformed");

      expect(() => {
        guard.handleRequest(null, false, jwtError, {} as any);
      }).toThrow(UnauthorizedException);

      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.invalidToken");
    });

    it("handleRequest_noUserWithoutJwtError_throwsTokenNotProvided", () => {
      const info = new Error("No auth token");

      expect(() => {
        guard.handleRequest(null, false, info, {} as any);
      }).toThrow(UnauthorizedException);

      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.accessTokenNotProvided");
    });

    it("handleRequest_validUser_attachesToRequestAndReturnsUser", () => {
      const user = { sub: 1, email: "test@example.com", role: "CASHIER", language: "en", tokenType: "access" };
      const req = {};
      const context = {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as unknown as ExecutionContext;

      const result = guard.handleRequest(null, user, null, context);

      expect(result).toBe(user);
      expect((req as any)[Keys.User]).toBe(user);
    });
  });
});

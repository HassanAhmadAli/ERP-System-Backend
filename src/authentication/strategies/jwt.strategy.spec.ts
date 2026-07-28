/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === "JWT_SECRET") return "test-secret-that-is-at-least-32-characters-long!!";
              if (key === "JWT_AUDIENCE") return "localhost:3000";
              if (key === "JWT_ISSUER") return "localhost:3000";
              return undefined;
            }),
            get: jest.fn().mockImplementation((key: string) => {
              if (key === "JWT_AUDIENCE") return "localhost:3000";
              if (key === "JWT_ISSUER") return "localhost:3000";
              return undefined;
            }),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockReturnValue("invalid token"),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    i18nService = module.get(I18nService);
  });

  describe("validate", () => {
    it("validate_validPayload_returnsParsedActiveUser", () => {
      const payload = {
        sub: 1,
        email: "test@example.com",
        role: "CASHIER",
        language: "en",
        tokenType: "access",
      };

      const result = strategy.validate(payload);

      expect(result).toStrictEqual({
        sub: 1,
        email: "test@example.com",
        role: "CASHIER",
        language: "en",
        tokenType: "access",
      });
    });

    it("validate_invalidPayload_throwsUnauthorized", () => {
      const payload = {
        sub: 1,
        tokenType: "access",
      };

      expect(() => strategy.validate(payload)).toThrow();
      expect(i18nService.t).toHaveBeenCalledWith("errors.auth.invalidToken");
    });
  });
});

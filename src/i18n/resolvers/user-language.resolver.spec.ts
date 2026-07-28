import { ExecutionContext } from "@nestjs/common";
import { UserLanguageResolver } from "./user-language.resolver";

describe("UserLanguageResolver", () => {
  let resolver: UserLanguageResolver;

  beforeEach(() => {
    resolver = new UserLanguageResolver();
  });

  function mockContext(authHeader?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: authHeader },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }

  function makeToken(payload: Record<string, unknown>): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `header.${encoded}.signature`;
  }

  it("returns undefined when no authorization header", () => {
    expect(resolver.resolve(mockContext(undefined))).toBeUndefined();
  });

  it("returns language from JWT payload", () => {
    const token = makeToken({ language: "ar" });
    expect(resolver.resolve(mockContext(`Bearer ${token}`))).toBe("ar");
  });

  it("returns undefined when token payload has no language field", () => {
    const token = makeToken({ sub: 1, role: "CASHIER" });
    expect(resolver.resolve(mockContext(`Bearer ${token}`))).toBeUndefined();
  });

  it("returns undefined when token payload language is not a string", () => {
    const token = makeToken({ language: 42 });
    expect(resolver.resolve(mockContext(`Bearer ${token}`))).toBeUndefined();
  });

  it("returns undefined for malformed JWT (not 3 parts)", () => {
    expect(resolver.resolve(mockContext("Bearer bad.token"))).toBeUndefined();
  });

  it("returns undefined for invalid base64 payload", () => {
    expect(resolver.resolve(mockContext("Bearer header.!!!.signature"))).toBeUndefined();
  });

  it("returns undefined when token is undefined after split", () => {
    expect(resolver.resolve(mockContext("Bearer "))).toBeUndefined();
  });
});

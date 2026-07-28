import { of, firstValueFrom } from "rxjs";
import { AuditContextInterceptor } from "./audit-context.interceptor";
import { runWithAuditContext } from "./audit-context";

jest.mock("./audit-context", () => ({
  runWithAuditContext: jest.fn(),
}));

// eslint-disable-next-line no-var
var mockUserKey: symbol;
jest.mock("@/common/const", () => {
  mockUserKey = Symbol("User_Key");
  return {
    Keys: { User: mockUserKey },
    AuditAction: { CREATE: "CREATE", UPDATE: "UPDATE", DELETE: "DELETE" },
    STAFF_ROLES: ["CASHIER", "WAREHOUSE_WORKER", "ACCOUNTANT", "STORE_MANAGER"],
  };
});

const mockedRunWithAuditContext = jest.mocked(runWithAuditContext);

describe("AuditContextInterceptor", () => {
  let interceptor: AuditContextInterceptor;

  beforeEach(() => {
    interceptor = new AuditContextInterceptor();
    jest.clearAllMocks();
    mockedRunWithAuditContext.mockImplementation((_actor, fn) => fn());
  });

  function mockContext(user?: { sub: number; role: string }) {
    const req: Record<string | symbol, object> = {};
    if (user) {
      req[mockUserKey] = user;
    }
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    };
  }

  it("wraps handler in runWithAuditContext when user is present", async () => {
    const user = { sub: 5, role: "ACCOUNTANT" };
    const context = mockContext(user);
    const callHandler = { handle: () => of("result") };

    const result = (await firstValueFrom(interceptor.intercept(context, callHandler))) as object;
    expect(result).toBe("result");
    expect(mockedRunWithAuditContext).toHaveBeenCalledWith({ userId: 5, role: "ACCOUNTANT" }, expect.any(Function));
  });

  it("passes through when user is not present", async () => {
    const context = mockContext(undefined);
    const callHandler = { handle: () => of("passthrough") };

    const result = (await firstValueFrom(interceptor.intercept(context, callHandler))) as object;
    expect(result).toBe("passthrough");
    expect(mockedRunWithAuditContext).not.toHaveBeenCalled();
  });
});

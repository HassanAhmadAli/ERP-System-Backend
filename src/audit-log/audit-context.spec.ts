/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { runWithAuditContext, setAuditRecorder, recordAuditFromExtension } from "./audit-context";

jest.mock("@/common/const", () => {
  const actual = jest.requireActual("@/common/const");
  return {
    ...actual,
    STAFF_ROLES: ["CASHIER", "WAREHOUSE_WORKER", "ACCOUNTANT", "STORE_MANAGER"],
  };
});

describe("audit-context", () => {
  let recorder: jest.Mock;

  beforeEach(() => {
    recorder = jest.fn();
    setAuditRecorder(recorder);
  });

  describe("runWithAuditContext", () => {
    it("runs the function and provides actor via AsyncLocalStorage", () => {
      let captured: unknown;
      runWithAuditContext({ userId: 1, role: "CASHIER" as never }, () => {
        captured = "done";
      });
      expect(captured).toBe("done");
    });
  });

  describe("recordAuditFromExtension", () => {
    it("calls recorder for staff role", async () => {
      await runWithAuditContext({ userId: 1, role: "CASHIER" as never }, async () => {
        await recordAuditFromExtension({ action: "CREATE", entity: "User", entityId: "5" });
      });
      expect(recorder).toHaveBeenCalledWith({ action: "CREATE", entity: "User", entityId: "5", userId: 1 });
    });

    it("does not call recorder when there is no actor", async () => {
      await recordAuditFromExtension({ action: "CREATE", entity: "User", entityId: "5" });
      expect(recorder).not.toHaveBeenCalled();
    });

    it("does not call recorder for non-staff role", async () => {
      await runWithAuditContext({ userId: 2, role: "CUSTOMER" as never }, async () => {
        await recordAuditFromExtension({ action: "CREATE", entity: "User", entityId: "5" });
      });
      expect(recorder).not.toHaveBeenCalled();
    });

    it("does not call recorder when no recorder is set", async () => {
      setAuditRecorder(null as never);
      await runWithAuditContext({ userId: 1, role: "CASHIER" as never }, async () => {
        await recordAuditFromExtension({ action: "CREATE", entity: "User", entityId: "5" });
      });
      expect(recorder).not.toHaveBeenCalled();
    });
  });

  describe("setAuditRecorder", () => {
    it("replaces the recorder", async () => {
      const newRecorder = jest.fn();
      setAuditRecorder(newRecorder);
      await runWithAuditContext({ userId: 1, role: "CASHIER" as never }, async () => {
        await recordAuditFromExtension({ action: "DELETE", entity: "Product", entityId: "3" });
      });
      expect(newRecorder).toHaveBeenCalled();
      expect(recorder).not.toHaveBeenCalled();
    });
  });
});

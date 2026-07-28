/* eslint-disable @typescript-eslint/unbound-method */
import { auditExtensionHandlers } from "./audit-extension";
import { recordAuditFromExtension } from "@/audit-log/audit-context";

jest.mock("@/audit-log/audit-context", () => ({
  recordAuditFromExtension: jest.fn(),
}));

const mockedRecordAudit = jest.mocked(recordAuditFromExtension);

type QueryHandler = (params: { model: string; args: unknown; query: jest.Mock }) => unknown;

interface ExtendedClient {
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  updateMany: jest.Mock;
  deleteMany: jest.Mock;
  rawCreate: jest.Mock;
  rawUpdate: jest.Mock;
  rawDelete: jest.Mock;
  rawUpdateMany: jest.Mock;
  rawDeleteMany: jest.Mock;
}

interface HandlerMap {
  create: QueryHandler;
  update: QueryHandler;
  delete: QueryHandler;
  updateMany: QueryHandler;
  deleteMany: QueryHandler;
}

const handlers: HandlerMap = {
  create: auditExtensionHandlers.create as QueryHandler,
  update: auditExtensionHandlers.update as QueryHandler,
  delete: auditExtensionHandlers.delete as QueryHandler,
  updateMany: auditExtensionHandlers.updateMany as QueryHandler,
  deleteMany: auditExtensionHandlers.deleteMany as QueryHandler,
};

function createExtendedClient(): ExtendedClient {
  const rawCreate = jest.fn().mockResolvedValue({ id: 5, name: "Test" });
  const rawUpdate = jest.fn().mockResolvedValue({ id: 5, name: "Updated" });
  const rawDelete = jest.fn().mockResolvedValue({ id: 5, name: "Deleted" });
  const rawUpdateMany = jest.fn().mockResolvedValue({ count: 2 });
  const rawDeleteMany = jest.fn().mockResolvedValue({ count: 1 });

  const wrap = (raw: jest.Mock, handler: QueryHandler): jest.Mock =>
    jest.fn().mockImplementation((args: unknown) => handler({ model: "User", args, query: raw }));

  return {
    create: wrap(rawCreate, handlers.create),
    update: wrap(rawUpdate, handlers.update),
    delete: wrap(rawDelete, handlers.delete),
    updateMany: wrap(rawUpdateMany, handlers.updateMany),
    deleteMany: wrap(rawDeleteMany, handlers.deleteMany),
    rawCreate,
    rawUpdate,
    rawDelete,
    rawUpdateMany,
    rawDeleteMany,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("auditPrismaExtension", () => {
  it("audits create on a model", async () => {
    const ext = createExtendedClient();
    ext.rawCreate.mockResolvedValue({ id: 5, name: "New User" });

    const result = (await ext.create({ data: { name: "New User" } })) as object;

    expect(result).toStrictEqual({ id: 5, name: "New User" });
    expect(mockedRecordAudit).toHaveBeenCalledWith({
      action: "CREATE",
      entity: "User",
      entityId: "5",
      newValue: { id: 5, name: "New User" },
    });
  });

  it("audits update on a model", async () => {
    const ext = createExtendedClient();
    ext.rawUpdate.mockResolvedValue({ id: 5, name: "Updated User" });

    const result = (await ext.update({ where: { id: 5 }, data: { name: "Updated User" } })) as object;

    expect(result).toStrictEqual({ id: 5, name: "Updated User" });
    expect(mockedRecordAudit).toHaveBeenCalledWith({
      action: "UPDATE",
      entity: "User",
      entityId: "5",
      oldValue: { id: 5 },
      newValue: { id: 5, name: "Updated User" },
    });
  });

  it("audits delete on a model", async () => {
    const ext = createExtendedClient();
    ext.rawDelete.mockResolvedValue({ id: 5, name: "Deleted User" });

    const result = (await ext.delete({ where: { id: 5 } })) as object;

    expect(result).toStrictEqual({ id: 5, name: "Deleted User" });
    expect(mockedRecordAudit).toHaveBeenCalledWith({
      action: "DELETE",
      entity: "User",
      entityId: "5",
      oldValue: { id: 5 },
    });
  });

  it("audits updateMany on a model", async () => {
    const ext = createExtendedClient();

    const result = (await ext.updateMany({ where: { role: "CASHIER" }, data: { isActive: false } })) as object;

    expect(result).toStrictEqual({ count: 2 });
    expect(mockedRecordAudit).toHaveBeenCalledWith({
      action: "UPDATE",
      entity: "User",
      entityId: "many",
      oldValue: { role: "CASHIER" },
      newValue: { isActive: false },
    });
  });

  it("audits deleteMany on a model", async () => {
    const ext = createExtendedClient();

    const result = (await ext.deleteMany({ where: { isActive: false } })) as object;

    expect(result).toStrictEqual({ count: 1 });
    expect(mockedRecordAudit).toHaveBeenCalledWith({
      action: "DELETE",
      entity: "User",
      entityId: "many",
      oldValue: { isActive: false },
    });
  });

  it("redacts sensitive fields in newValue", async () => {
    const ext = createExtendedClient();
    ext.rawCreate.mockResolvedValue({ id: 1, passwordHash: "secret123", name: "User" });

    const result = (await ext.create({ data: { passwordHash: "secret123", name: "User" } })) as object;

    expect(result).toStrictEqual({ id: 1, passwordHash: "secret123", name: "User" });
    expect(mockedRecordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        newValue: expect.objectContaining({ passwordHash: "[REDACTED]" }) as object,
      }),
    );
  });

  it("extracts entityId from where clause when result has no id", async () => {
    const ext = createExtendedClient();
    ext.rawDelete.mockResolvedValue({ count: 1 });

    const result = (await ext.delete({ where: { email: "test@test.com" } })) as object;

    expect(result).toStrictEqual({ count: 1 });
    expect(mockedRecordAudit).toHaveBeenCalledWith(expect.objectContaining({ entityId: "test@test.com" }) as object);
  });
});

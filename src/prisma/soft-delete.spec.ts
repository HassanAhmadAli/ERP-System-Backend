import { softDeleteQueryOptions } from "./soft-delete";

type QueryHandler = (params: { model: string; args: unknown; query: jest.Mock }) => unknown;

interface ExtendedClient {
  aggregate: jest.Mock;
  count: jest.Mock;
  findFirst: jest.Mock;
  findFirstOrThrow: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findUniqueOrThrow: jest.Mock;
  groupBy: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  updateManyAndReturn: jest.Mock;
  upsert: jest.Mock;
}

function createExtendedClient(): ExtendedClient {
  const mocks: ExtendedClient = {
    aggregate: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    groupBy: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    updateManyAndReturn: jest.fn(),
    upsert: jest.fn(),
  };

  const handlers = softDeleteQueryOptions as Record<string, QueryHandler>;

  const wrap = (op: keyof ExtendedClient): jest.Mock => {
    const handler = handlers[op]!;
    const raw = mocks[op];
    return jest.fn().mockImplementation((args: unknown) => handler({ model: "productPhoto", args, query: raw }));
  };

  const wrapped: ExtendedClient = {
    aggregate: wrap("aggregate"),
    count: wrap("count"),
    findFirst: wrap("findFirst"),
    findFirstOrThrow: wrap("findFirstOrThrow"),
    findMany: wrap("findMany"),
    findUnique: wrap("findUnique"),
    findUniqueOrThrow: wrap("findUniqueOrThrow"),
    groupBy: wrap("groupBy"),
    update: wrap("update"),
    updateMany: wrap("updateMany"),
    updateManyAndReturn: wrap("updateManyAndReturn"),
    upsert: wrap("upsert"),
  };

  return wrapped;
}

describe("softDeletePrismaExtension", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const ops = [
    "aggregate",
    "count",
    "findFirst",
    "findFirstOrThrow",
    "findMany",
    "findUnique",
    "findUniqueOrThrow",
    "update",
  ] as const;

  for (const op of ops) {
    it(`${op} adds deletedAt: null to where`, async () => {
      const ext = createExtendedClient();

      await ext[op]({ where: { id: 1 } });

      expect(ext[op]).toHaveBeenCalledWith({
        where: { deletedAt: null, id: 1 },
      });
    });

    it(`${op} bypasses injection when where has explicit deletedAt`, async () => {
      const ext = createExtendedClient();

      await ext[op]({ where: { deletedAt: { not: null } } });

      expect(ext[op]).toHaveBeenCalledWith({
        where: { deletedAt: { not: null } },
      });
    });
  }

  it("groupBy adds deletedAt when no where", async () => {
    const ext = createExtendedClient();

    await ext.groupBy({ by: ["id"] });

    expect(ext.groupBy).toHaveBeenCalledWith({
      by: ["id"],
      where: { deletedAt: null },
    });
  });

  it("groupBy merges deletedAt when where exists", async () => {
    const ext = createExtendedClient();

    await ext.groupBy({ by: ["id"], where: { isActive: true } });

    expect(ext.groupBy).toHaveBeenCalledWith({
      by: ["id"],
      where: { deletedAt: null, isActive: true },
    });
  });

  it("updateMany adds deletedAt when no where", async () => {
    const ext = createExtendedClient();

    await ext.updateMany({ data: { isActive: true } });

    expect(ext.updateMany).toHaveBeenCalledWith({
      data: { isActive: true },
      where: { deletedAt: null },
    });
  });

  it("updateManyAndReturn merges deletedAt when where exists", async () => {
    const ext = createExtendedClient();

    await ext.updateManyAndReturn({ where: { id: 1 }, data: { isActive: false } });

    expect(ext.updateManyAndReturn).toHaveBeenCalledWith({
      where: { deletedAt: null, id: 1 },
      data: { isActive: false },
    });
  });

  it("upsert adds deletedAt to where", async () => {
    const ext = createExtendedClient();

    await ext.upsert({ where: { id: 1 }, create: {}, update: {} });

    expect(ext.upsert).toHaveBeenCalledWith({
      where: { deletedAt: null, id: 1 },
      create: {},
      update: {},
    });
  });

  it("bypasses upsert when where has explicit deletedAt", async () => {
    const ext = createExtendedClient();

    await ext.upsert({ where: { deletedAt: null }, create: {}, update: {} });

    expect(ext.upsert).toHaveBeenCalledWith({
      where: { deletedAt: null },
      create: {},
      update: {},
    });
  });
});

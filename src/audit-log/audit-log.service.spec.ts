import { Test, TestingModule } from "@nestjs/testing";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { AuditLogService } from "./audit-log.service";
import { setAuditRecorder } from "./audit-context";

jest.mock("./audit-context", () => ({
  setAuditRecorder: jest.fn(),
}));

const mockedSetAuditRecorder = jest.mocked(setAuditRecorder);

describe("AuditLogService", () => {
  let service: AuditLogService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogService, { provide: PrismaService, useValue: { client: prisma } }],
    }).compile();

    service = module.get(AuditLogService);
  });

  describe("onModuleInit", () => {
    it("registers the audit recorder", () => {
      service.onModuleInit();
      expect(mockedSetAuditRecorder).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("record", () => {
    it("creates an audit log entry", async () => {
      const mockCreated = { id: 1, userId: 1, action: "CREATE", entity: "User", entityId: "5" };
      prisma.auditLog.create.mockResolvedValue(mockCreated as never);

      await service.record({
        userId: 1,
        action: "CREATE",
        entity: "User",
        entityId: "5",
        oldValue: { name: "Old" },
        newValue: { name: "New" },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          action: "CREATE",
          entity: "User",
          entityId: "5",
          oldValue: expect.any(Object) as object,
          newValue: expect.any(Object) as object,
        },
      });
    });
  });

  describe("findAll", () => {
    const mockLogs = [
      {
        id: 1,
        userId: 1,
        action: "CREATE",
        entity: "User",
        entityId: "5",
        performedAt: new Date(),
        user: { id: 1, fullName: "Admin", fullNameAr: null, email: "admin@test.com", role: "STORE_MANAGER" },
      },
    ];

    it("returns paginated audit logs", async () => {
      prisma.auditLog.findMany.mockResolvedValue(mockLogs as never);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({ limit: 10, offset: 0, deleted: false });

      expect(result).toStrictEqual({
        data: mockLogs,
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
    });

    it("filters by userId", async () => {
      prisma.auditLog.findMany.mockResolvedValue([] as never);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, userId: 3, deleted: false });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 3 }) as object as { userId: 3 },
        }),
      );
    });

    it("filters by entity with case-insensitive contains", async () => {
      prisma.auditLog.findMany.mockResolvedValue([] as never);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, entity: "user", deleted: false });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: { contains: "user", mode: "insensitive" },
          }) as object,
        }),
      );
    });

    it("filters by action with case-insensitive contains", async () => {
      prisma.auditLog.findMany.mockResolvedValue([] as never);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, action: "create", deleted: false });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: { contains: "create", mode: "insensitive" },
          }) as object,
        }),
      );
    });

    it("filters by date range", async () => {
      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");
      prisma.auditLog.findMany.mockResolvedValue([] as never);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ limit: 10, offset: 0, from, to, deleted: false });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            performedAt: { gte: from, lte: to },
          }) as object,
        }),
      );
    });
  });
});

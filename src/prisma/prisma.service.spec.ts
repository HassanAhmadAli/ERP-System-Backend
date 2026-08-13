/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PrismaService, createPrismaClient } from "./prisma.service";

jest.mock("./generated/prisma-client/client", () => {
  const client = {
    $extends: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  client.$extends.mockReturnValue(client);
  return { PrismaClient: jest.fn(() => client) };
});

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("./soft-delete", () => ({
  softDeletePrismaExtension: Symbol("softDeletePrismaExtension"),
}));

jest.mock("./audit-extension", () => ({
  auditPrismaExtension: Symbol("auditPrismaExtension"),
}));

const { PrismaClient } = jest.requireMock("./generated/prisma-client/client") as {
  PrismaClient: jest.Mock;
};
const { PrismaPg } = jest.requireMock("@prisma/adapter-pg") as {
  PrismaPg: jest.Mock;
};

const createMockPrismaClient = () => {
  const client = {
    $extends: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  client.$extends.mockReturnValue(client);
  return client;
};

describe("PrismaService", () => {
  let service: PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === "DATABASE_URL") return "postgresql://localhost:5432/test";
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PrismaService);
  });

  describe("createPrismaClient", () => {
    it("creates PrismaPg adapter with connection string and max connections", () => {
      jest.clearAllMocks();
      const mockClient = createMockPrismaClient();
      (PrismaClient as jest.Mock).mockReturnValue(mockClient);

      createPrismaClient({ DATABASE_URL: "postgresql://localhost:5432/test" });

      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: "postgresql://localhost:5432/test",
        max: 20,
      });
    });

    it("applies softDelete and audit extensions via $extends chain", () => {
      jest.clearAllMocks();
      const mockClient = createMockPrismaClient();
      (PrismaClient as jest.Mock).mockReturnValue(mockClient);

      createPrismaClient({ DATABASE_URL: "postgresql://localhost:5432/test" });

      expect(mockClient.$extends).toHaveBeenCalledTimes(2);
    });
  });

  describe("PrismaService", () => {
    it("creates prisma client on construction with DATABASE_URL from config", () => {
      expect(PrismaClient).toHaveBeenCalled();
      expect(service.client).toBeDefined();
    });

    it("onModuleInit calls $connect", async () => {
      await service.onModuleInit();

      expect(service.client.$connect).toHaveBeenCalledTimes(1);
    });

    it("onModuleDestroy calls $disconnect", async () => {
      await service.onModuleDestroy();

      expect(service.client.$disconnect).toHaveBeenCalledTimes(1);
    });
  });
});

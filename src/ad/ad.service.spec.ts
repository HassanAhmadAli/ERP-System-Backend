import { Test, TestingModule } from "@nestjs/testing";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaService } from "@/prisma/prisma.service";
import { createPrismaClient } from "@/prisma/prisma.service";
import { AdService } from "./ad.service";

describe("AdService", () => {
  let service: AdService;
  let prisma: DeepMockProxy<ReturnType<typeof createPrismaClient>>;

  const mockAd = {
    id: 1,
    title: "Summer Sale",
    titleAr: null,
    description: "Big discounts",
    descriptionAr: null,
    imageUrl: null,
    linkUrl: null,
    placement: "HOME",
    isActive: true,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as const;

  beforeEach(async () => {
    prisma = mockDeep<ReturnType<typeof createPrismaClient>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdService, { provide: PrismaService, useValue: { client: prisma } }],
    }).compile();

    service = module.get(AdService);
  });

  describe("create", () => {
    it("creates an advertisement", async () => {
      const dto = {
        title: "Summer Sale",
        placement: "HOME" as const,
        isActive: true,
        startDate: new Date("2024-01-01"),
      };
      prisma.advertisement.create.mockResolvedValue(mockAd as never);

      const result = await service.create(dto);

      expect(result).toStrictEqual(mockAd);
      expect(prisma.advertisement.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe("findAll", () => {
    const query = { limit: 10, offset: 0, deleted: false };

    it("returns paginated ads without activeOnly filter", async () => {
      prisma.advertisement.findMany.mockResolvedValue([mockAd] as never);
      prisma.advertisement.count.mockResolvedValue(1);

      const result = await service.findAll(query, false);

      expect(result).toStrictEqual({
        data: [mockAd],
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
      expect(prisma.advertisement.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("filters by active date range when activeOnly is true", async () => {
      prisma.advertisement.findMany.mockResolvedValue([] as never);
      prisma.advertisement.count.mockResolvedValue(0);

      await service.findAll(query, true);

      const callArg = prisma.advertisement.findMany.mock.calls[0]![0]!;
      expect(callArg.where).toMatchObject({
        isActive: true,
        startDate: { lte: expect.any(Date) as Date },
        OR: [{ endDate: null }, { endDate: { gte: expect.any(Date) as Date } }],
      });
    });
  });

  describe("findOne", () => {
    it("returns the ad when found", async () => {
      prisma.advertisement.findUniqueOrThrow.mockResolvedValue(mockAd as never);

      const result = await service.findOne(1);

      expect(result).toStrictEqual(mockAd);
      expect(prisma.advertisement.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("propagates rejection when not found", async () => {
      const error = new Error("Not found");
      prisma.advertisement.findUniqueOrThrow.mockRejectedValue(error as never);

      await expect(service.findOne(999)).rejects.toThrow(error);
    });
  });

  describe("update", () => {
    it("updates the ad after confirming it exists", async () => {
      const dto = { title: "Updated Title" };
      prisma.advertisement.findUniqueOrThrow.mockResolvedValue(mockAd as never);
      prisma.advertisement.update.mockResolvedValue({ ...mockAd, title: "Updated Title" } as never);

      const result = await service.update(1, dto);

      expect(result).toStrictEqual({ ...mockAd, title: "Updated Title" });
      expect(prisma.advertisement.update).toHaveBeenCalledWith({ where: { id: 1 }, data: dto });
    });

    it("propagates rejection when ad not found", async () => {
      prisma.advertisement.findUniqueOrThrow.mockRejectedValue(new Error("Not found"));

      await expect(service.update(999, { title: "Fail" })).rejects.toThrow("Not found");
      expect(prisma.advertisement.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes the ad after confirming it exists", async () => {
      prisma.advertisement.findUniqueOrThrow.mockResolvedValue(mockAd as never);
      prisma.advertisement.delete.mockResolvedValue(mockAd as never);

      const result = await service.remove(1);

      expect(result).toStrictEqual(mockAd);
      expect(prisma.advertisement.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("propagates rejection when ad not found", async () => {
      prisma.advertisement.findUniqueOrThrow.mockRejectedValue(new Error("Not found"));

      await expect(service.remove(999)).rejects.toThrow("Not found");
      expect(prisma.advertisement.delete).not.toHaveBeenCalled();
    });
  });
});

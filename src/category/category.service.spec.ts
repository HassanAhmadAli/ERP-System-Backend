/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, BadRequestException } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { PrismaService } from "@/prisma/prisma.service";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";

describe("CategoryService", () => {
  let service: CategoryService;
  let prismaService: jest.Mocked<PrismaService>;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  const mockCategory = {
    id: 1,
    name: "Electronics",
    nameAr: null,
    description: "Electronic items",
    descriptionAr: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              category: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findUniqueOrThrow: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
              },
              product: {
                count: jest.fn(),
              },
            },
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string, options?: { args?: Record<string, unknown> }) => {
              const translations: Record<string, string> = {
                "errors.category.nameExists": `Category name "${String(options?.args?.name ?? "")}" already exists`,
                "errors.category.cannotDeleteWithProducts": `Cannot delete category with ${String(options?.args?.count ?? 0)} products`,
                "responses.category.deleted": `Category ${String(options?.args?.id ?? "")} deleted`,
              };
              return translations[key] ?? key;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(CategoryService);
    prismaService = module.get(PrismaService);
    i18nService = module.get(I18nService);
  });

  describe("create", () => {
    const createDto = { name: "Electronics", description: "Electronic items" };

    it("creates a category when name is unique", async () => {
      jest.mocked(prismaService.client.category.findUnique).mockResolvedValue(null);
      jest.mocked(prismaService.client.category.create).mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(result).toStrictEqual(mockCategory);
      expect(prismaService.client.category.findUnique).toHaveBeenCalledWith({
        select: { id: true },
        where: { name: createDto.name },
      });
    });

    it("throws ConflictException when name already exists", async () => {
      jest.mocked(prismaService.client.category.findUnique).mockResolvedValue({ id: 2 });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.category.nameExists", {
        args: { name: createDto.name },
      });
    });

    it("throws ConflictException when nameAr already exists", async () => {
      const dto = { name: "Electronics", nameAr: "إلكترونيات" };
      jest.mocked(prismaService.client.category.findUnique).mockResolvedValue(null);
      jest.mocked(prismaService.client.category.findFirst).mockResolvedValue({ id: 3 });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.category.nameExists", {
        args: { name: dto.nameAr },
      });
    });

    it("skips nameAr conflict check when nameAr is not provided", async () => {
      jest.mocked(prismaService.client.category.findUnique).mockResolvedValue(null);
      jest.mocked(prismaService.client.category.create).mockResolvedValue(mockCategory);

      await service.create(createDto);

      expect(prismaService.client.category.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    const query = { limit: 10, offset: 0, deleted: false };

    it("returns paginated categories without search", async () => {
      const categories = [mockCategory];
      jest.mocked(prismaService.client.category.findMany).mockResolvedValue(categories);
      jest.mocked(prismaService.client.category.count).mockResolvedValue(1);

      const result = await service.findAll(query, undefined);

      expect(result).toStrictEqual({
        data: categories,
        total: 1,
        limit: 10,
        offset: 0,
        isFinalPage: true,
      });
      expect(prismaService.client.category.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      });
    });

    it("filters by search term across name and nameAr", async () => {
      jest.mocked(prismaService.client.category.findMany).mockResolvedValue([]);
      jest.mocked(prismaService.client.category.count).mockResolvedValue(0);

      await service.findAll(query, "electronics");

      expect(prismaService.client.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "electronics", mode: "insensitive" } },
              { nameAr: { contains: "electronics", mode: "insensitive" } },
            ],
          },
        }),
      );
    });
  });

  describe("findOne", () => {
    it("returns category with products and count", async () => {
      const categoryWithProducts = {
        ...mockCategory,
        products: [{ id: 1, name: "Laptop", nameAr: null, barcode: "123", sellingPrice: 999.99, quantityInStock: 10 }],
        _count: { products: 1 },
      };
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue(categoryWithProducts);

      const result = await service.findOne(1);

      expect(result).toStrictEqual(categoryWithProducts);
      expect(prismaService.client.category.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          products: {
            select: { id: true, name: true, nameAr: true, barcode: true, sellingPrice: true, quantityInStock: true },
            take: 10,
            orderBy: { name: "asc" },
          },
          _count: { select: { products: true } },
        },
      });
    });

    it("propagates Prisma not-found error", async () => {
      const error = new Error("Category not found");
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockRejectedValue(error);

      await expect(service.findOne(999)).rejects.toThrow(error);
    });
  });

  describe("update", () => {
    const updateDto = { name: "Updated Electronics" };

    it("updates category when name is unique", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue(mockCategory);
      jest.mocked(prismaService.client.category.findFirst).mockResolvedValue(null);
      jest.mocked(prismaService.client.category.update).mockResolvedValue({
        ...mockCategory,
        name: "Updated Electronics",
        _count: { products: 0 },
      });

      const result = await service.update(1, updateDto);

      expect(result).toStrictEqual({
        ...mockCategory,
        name: "Updated Electronics",
        _count: { products: 0 },
      });
    });

    it("throws ConflictException when new name conflicts with existing category", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue(mockCategory);
      jest.mocked(prismaService.client.category.findFirst).mockResolvedValue({ id: 2 });

      await expect(service.update(1, updateDto)).rejects.toThrow(ConflictException);
    });

    it("throws ConflictException when new nameAr conflicts", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue(mockCategory);
      jest.mocked(prismaService.client.category.findFirst).mockResolvedValueOnce({ id: 3 });

      await expect(service.update(1, { nameAr: "إلكترونيات" })).rejects.toThrow(ConflictException);
    });

    it("propagates Prisma not-found error", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockRejectedValue(new Error("Not found"));

      await expect(service.update(999, updateDto)).rejects.toThrow("Not found");
    });
  });

  describe("remove", () => {
    it("deletes category when no products exist", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue(mockCategory);
      jest.mocked(prismaService.client.product.count).mockResolvedValue(0);
      jest.mocked(prismaService.client.category.delete).mockResolvedValue(mockCategory);

      await service.remove(1);

      expect(prismaService.client.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(i18nService.t).toHaveBeenCalledWith("responses.category.deleted", { args: { id: 1 } });
    });

    it("throws BadRequestException when category has products", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue(mockCategory);
      jest.mocked(prismaService.client.product.count).mockResolvedValue(5);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(prismaService.client.category.delete).not.toHaveBeenCalled();
    });

    it("propagates Prisma not-found error", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockRejectedValue(new Error("Not found"));

      await expect(service.remove(999)).rejects.toThrow("Not found");
    });
  });
});

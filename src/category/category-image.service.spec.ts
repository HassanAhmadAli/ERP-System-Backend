/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, StreamableFile } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { CategoryImageService } from "./category-image.service";
import { PrismaService } from "@/prisma/prisma.service";
import { normalizeUploadPath, resolveUploadPath } from "@/upload/resolve-upload-path";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";

jest.mock("@/upload/resolve-upload-path", () => ({
  normalizeUploadPath: jest.fn(),
  resolveUploadPath: jest.fn(),
}));

jest.mock("node:fs", () => ({
  ...jest.requireActual("node:fs"),
  createReadStream: jest.fn(),
}));

jest.mock("node:fs/promises", () => ({
  ...jest.requireActual("node:fs/promises"),
  unlink: jest.fn(),
}));

const mockedNormalizeUploadPath = jest.mocked(normalizeUploadPath);
const mockedResolveUploadPath = jest.mocked(resolveUploadPath);
const mockedCreateReadStream = jest.mocked(createReadStream);
const mockedUnlink = jest.mocked(unlink);

describe("CategoryImageService", () => {
  let service: CategoryImageService;
  let prismaService: jest.Mocked<PrismaService>;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  const mockCategory = {
    id: 1,
    name: "Electronics",
    nameAr: null,
    description: null,
    descriptionAr: null,
    imageUrl: null,
    storedFileId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStoredFile = {
    id: "file-123",
    originalname: "category.png",
    mimetype: "image/png",
    path: "uploads/file-123",
    size: 1024,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const txClient = {
    category: { update: jest.fn() },
    storedFile: { update: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedNormalizeUploadPath.mockImplementation((_filePath: string, filename: string) => `uploads/${filename}`);
    mockedResolveUploadPath.mockReturnValue("/resolved/uploads/file-123");
    mockedUnlink.mockResolvedValue(undefined);
    mockedCreateReadStream.mockReturnValue({
      on: jest.fn(),
      pipe: jest.fn(),
    } as unknown as import("node:fs").ReadStream);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryImageService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              category: {
                findUniqueOrThrow: jest.fn(),
                update: jest.fn(),
              },
              storedFile: {
                create: jest.fn(),
                update: jest.fn(),
                findUniqueOrThrow: jest.fn(),
              },
              $transaction: jest.fn().mockImplementation((fn: (tx: typeof txClient) => unknown) => fn(txClient)),
            },
          },
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn().mockImplementation((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get(CategoryImageService);
    prismaService = module.get(PrismaService);
    i18nService = module.get(I18nService);
  });

  describe("uploadCategoryImage", () => {
    const file = {
      filename: "file-123",
      originalname: "category.png",
      mimetype: "image/png",
      path: "/tmp/uploads/file-123",
      size: 1024,
    } as Express.Multer.File;

    it("creates a stored file and points the category to it", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue(mockCategory as never);
      jest.mocked(prismaService.client.storedFile.create).mockResolvedValue(mockStoredFile as never);
      const updatedCategory = {
        ...mockCategory,
        storedFileId: "file-123",
        imageUrl: "/category/image/download/file-123",
      };
      jest.mocked(prismaService.client.category.update).mockResolvedValue(updatedCategory as never);

      const result = await service.uploadCategoryImage(1, file);

      expect(result).toStrictEqual(updatedCategory);
      expect(prismaService.client.storedFile.create).toHaveBeenCalledWith({
        data: {
          id: "file-123",
          originalname: "category.png",
          mimetype: "image/png",
          path: "uploads/file-123",
          size: 1024,
        },
      });
      expect(prismaService.client.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { storedFileId: "file-123", imageUrl: "/category/image/download/file-123" },
      });
      expect(prismaService.client.$transaction).not.toHaveBeenCalled();
    });

    it("deletes the existing image before uploading a new one", async () => {
      jest
        .mocked(prismaService.client.category.findUniqueOrThrow)
        .mockResolvedValueOnce({ ...mockCategory, storedFileId: "old-file" } as never)
        .mockResolvedValueOnce({
          ...mockCategory,
          storedFileId: "old-file",
          storedFile: { ...mockStoredFile, id: "old-file", path: "uploads/old-file" },
        } as never);
      jest.mocked(prismaService.client.storedFile.create).mockResolvedValue(mockStoredFile as never);
      jest
        .mocked(prismaService.client.category.update)
        .mockResolvedValue({ ...mockCategory, storedFileId: "file-123" } as never);
      mockedResolveUploadPath.mockReturnValue("/resolved/uploads/old-file");

      await service.uploadCategoryImage(1, file);

      expect(prismaService.client.$transaction).toHaveBeenCalled();
      expect(mockedUnlink).toHaveBeenCalledWith("/resolved/uploads/old-file");
      expect(prismaService.client.storedFile.create).toHaveBeenCalled();
    });

    it("propagates Prisma not-found error", async () => {
      const error = new Error("Category not found");
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockRejectedValue(error);

      await expect(service.uploadCategoryImage(999, file)).rejects.toThrow(error);
      expect(prismaService.client.storedFile.create).not.toHaveBeenCalled();
    });
  });

  describe("deleteCategoryImage", () => {
    it("returns fileNotFound message when category has no stored file", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue({
        ...mockCategory,
        storedFile: null,
      } as never);

      const result = await service.deleteCategoryImage(1);

      expect(result).toStrictEqual({ message: "errors.category.fileNotFound" });
      expect(i18nService.t).toHaveBeenCalledWith("errors.category.fileNotFound", { args: { id: 1 } });
      expect(prismaService.client.$transaction).not.toHaveBeenCalled();
      expect(mockedUnlink).not.toHaveBeenCalled();
    });

    it("soft-deletes the stored file and unlinks it from disk", async () => {
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue({
        ...mockCategory,
        storedFileId: "file-123",
        storedFile: mockStoredFile,
      } as never);

      const result = await service.deleteCategoryImage(1);

      expect(prismaService.client.$transaction).toHaveBeenCalled();
      expect(txClient.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { imageUrl: null, storedFileId: null },
      });
      expect(txClient.storedFile.update).toHaveBeenCalledWith({
        where: { id: "file-123" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockedUnlink).toHaveBeenCalledWith("/resolved/uploads/file-123");
      expect(result).toStrictEqual({ message: "responses.category.imageDeleted" });
      expect(i18nService.t).toHaveBeenCalledWith("responses.category.imageDeleted", { args: { categoryId: "1" } });
    });

    it("does not unlink when the file cannot be resolved on disk", async () => {
      mockedResolveUploadPath.mockReturnValue(undefined);
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue({
        ...mockCategory,
        storedFileId: "file-123",
        storedFile: mockStoredFile,
      } as never);

      await service.deleteCategoryImage(1);

      expect(mockedUnlink).not.toHaveBeenCalled();
    });

    it("does not throw when unlinking fails", async () => {
      mockedUnlink.mockRejectedValue(new Error("ENOENT"));
      jest.mocked(prismaService.client.category.findUniqueOrThrow).mockResolvedValue({
        ...mockCategory,
        storedFileId: "file-123",
        storedFile: mockStoredFile,
      } as never);

      await expect(service.deleteCategoryImage(1)).resolves.toBeDefined();
    });
  });

  describe("downloadCategoryImage", () => {
    it("returns a StreamableFile for the stored record", async () => {
      jest.mocked(prismaService.client.storedFile.findUniqueOrThrow).mockResolvedValue(mockStoredFile as never);

      const result = await service.downloadCategoryImage("file-123");

      expect(result).toBeInstanceOf(StreamableFile);
      expect(result.getHeaders()).toStrictEqual({
        type: "image/png",
        disposition: 'inline; filename="category.png"',
        length: undefined,
      });
      expect(mockedCreateReadStream).toHaveBeenCalledWith("/resolved/uploads/file-123");
    });

    it("throws NotFoundException when the file is missing on disk", async () => {
      mockedResolveUploadPath.mockReturnValue(undefined);
      jest.mocked(prismaService.client.storedFile.findUniqueOrThrow).mockResolvedValue(mockStoredFile as never);

      await expect(service.downloadCategoryImage("file-123")).rejects.toThrow(NotFoundException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.common.fileNotFoundOnDisk", { args: { id: "file-123" } });
    });

    it("propagates Prisma not-found error", async () => {
      const error = new Error("File not found");
      jest.mocked(prismaService.client.storedFile.findUniqueOrThrow).mockRejectedValue(error);

      await expect(service.downloadCategoryImage("missing")).rejects.toThrow(error);
    });
  });
});

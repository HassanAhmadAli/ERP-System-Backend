/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, StreamableFile } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { ProductPhotoService } from "./product-photo.service";
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

describe("ProductPhotoService", () => {
  let service: ProductPhotoService;
  let prismaService: jest.Mocked<PrismaService>;
  let i18nService: jest.Mocked<I18nService<I18nTranslations>>;

  const mockProduct = {
    id: 1,
    name: "Mouse",
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStoredFile = {
    id: "photo-1",
    originalname: "mouse.png",
    mimetype: "image/png",
    path: "uploads/photo-1",
    size: 2048,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPhoto = {
    id: 10,
    productId: 1,
    creatorId: 5,
    storedFileId: "photo-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    storedFile: mockStoredFile,
  };

  const txClient = {
    productPhoto: { update: jest.fn(), findFirst: jest.fn() },
    storedFile: { update: jest.fn() },
    product: { update: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedNormalizeUploadPath.mockImplementation((_filePath: string, filename: string) => `uploads/${filename}`);
    mockedResolveUploadPath.mockReturnValue("/resolved/uploads/photo-1");
    mockedUnlink.mockResolvedValue(undefined);
    mockedCreateReadStream.mockReturnValue({
      on: jest.fn(),
      pipe: jest.fn(),
    } as unknown as import("node:fs").ReadStream);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductPhotoService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              product: {
                findUniqueOrThrow: jest.fn(),
                update: jest.fn(),
              },
              storedFile: {
                create: jest.fn(),
                update: jest.fn(),
                findUniqueOrThrow: jest.fn(),
              },
              productPhoto: {
                findMany: jest.fn(),
                create: jest.fn(),
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

    service = module.get(ProductPhotoService);
    prismaService = module.get(PrismaService);
    i18nService = module.get(I18nService);
  });

  describe("listByProduct", () => {
    it("verifies the product exists and returns photos ordered by creation", async () => {
      jest.mocked(prismaService.client.product.findUniqueOrThrow).mockResolvedValue(mockProduct as never);
      jest.mocked(prismaService.client.productPhoto.findMany).mockResolvedValue([mockPhoto] as never);

      const result = await service.listByProduct(1);

      expect(result).toStrictEqual([mockPhoto]);
      expect(prismaService.client.product.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prismaService.client.productPhoto.findMany).toHaveBeenCalledWith({
        where: { productId: 1 },
        include: { storedFile: true },
        orderBy: { createdAt: "asc" },
      });
    });

    it("propagates Prisma not-found error for missing product", async () => {
      const error = new Error("Product not found");
      jest.mocked(prismaService.client.product.findUniqueOrThrow).mockRejectedValue(error);

      await expect(service.listByProduct(999)).rejects.toThrow(error);
    });
  });

  describe("uploadProductPhoto", () => {
    const file = {
      filename: "photo-1",
      originalname: "mouse.png",
      mimetype: "image/png",
      path: "/tmp/uploads/photo-1",
      size: 2048,
    } as Express.Multer.File;

    it("creates stored file and photo, and sets imageUrl when product has none", async () => {
      jest.mocked(prismaService.client.product.findUniqueOrThrow).mockResolvedValue(mockProduct as never);
      jest.mocked(prismaService.client.storedFile.create).mockResolvedValue(mockStoredFile as never);
      jest.mocked(prismaService.client.productPhoto.create).mockResolvedValue(mockPhoto as never);
      jest.mocked(prismaService.client.product.update).mockResolvedValue({
        ...mockProduct,
        imageUrl: "/product-photo/download/photo-1",
      } as never);

      const result = await service.uploadProductPhoto(1, 5, file);

      expect(result).toStrictEqual(mockPhoto);
      expect(prismaService.client.storedFile.create).toHaveBeenCalledWith({
        data: {
          id: "photo-1",
          originalname: "mouse.png",
          mimetype: "image/png",
          path: "uploads/photo-1",
          size: 2048,
        },
      });
      expect(prismaService.client.productPhoto.create).toHaveBeenCalledWith({
        data: { productId: 1, creatorId: 5, storedFileId: "photo-1" },
        include: { storedFile: true },
      });
      expect(prismaService.client.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { imageUrl: "/product-photo/download/photo-1" },
      });
    });

    it("does not re-point imageUrl when the product already has one", async () => {
      jest.mocked(prismaService.client.product.findUniqueOrThrow).mockResolvedValue({
        ...mockProduct,
        imageUrl: "/product-photo/download/old",
      } as never);
      jest.mocked(prismaService.client.storedFile.create).mockResolvedValue(mockStoredFile as never);
      jest.mocked(prismaService.client.productPhoto.create).mockResolvedValue(mockPhoto as never);

      await service.uploadProductPhoto(1, 5, file);

      expect(prismaService.client.product.update).not.toHaveBeenCalled();
    });

    it("propagates Prisma not-found error for missing product", async () => {
      const error = new Error("Product not found");
      jest.mocked(prismaService.client.product.findUniqueOrThrow).mockRejectedValue(error);

      await expect(service.uploadProductPhoto(999, 5, file)).rejects.toThrow(error);
    });
  });

  describe("deleteProductPhoto", () => {
    it("soft-deletes photo and stored file, and clears imageUrl when it was the current one", async () => {
      jest.mocked(prismaService.client.productPhoto.findUniqueOrThrow).mockResolvedValue({
        ...mockPhoto,
        storedFile: mockStoredFile,
        product: { id: 1, imageUrl: "/product-photo/download/photo-1" },
      } as never);
      jest.mocked(txClient.productPhoto.findFirst).mockResolvedValue(null);

      const result = await service.deleteProductPhoto(10);

      expect(prismaService.client.$transaction).toHaveBeenCalled();
      expect(txClient.productPhoto.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { deletedAt: expect.any(Date) },
      });
      expect(txClient.storedFile.update).toHaveBeenCalledWith({
        where: { id: "photo-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(txClient.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { imageUrl: null },
      });
      expect(mockedUnlink).toHaveBeenCalledWith("/resolved/uploads/photo-1");
      expect(result).toStrictEqual({ message: "responses.productPhoto.deleted" });
      expect(i18nService.t).toHaveBeenCalledWith("responses.productPhoto.deleted", { args: { photoId: "10" } });
    });

    it("re-points imageUrl to the next photo when one exists", async () => {
      jest.mocked(prismaService.client.productPhoto.findUniqueOrThrow).mockResolvedValue({
        ...mockPhoto,
        storedFile: mockStoredFile,
        product: { id: 1, imageUrl: "/product-photo/download/photo-1" },
      } as never);
      jest.mocked(txClient.productPhoto.findFirst).mockResolvedValue({
        ...mockPhoto,
        id: 11,
        storedFileId: "photo-2",
      } as never);

      await service.deleteProductPhoto(10);

      expect(txClient.productPhoto.findFirst).toHaveBeenCalledWith({
        where: { productId: 1, id: { not: 10 }, deletedAt: null },
        orderBy: { createdAt: "asc" },
      });
      expect(txClient.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { imageUrl: "/product-photo/download/photo-2" },
      });
    });

    it("leaves imageUrl untouched when the deleted photo is not the current one", async () => {
      jest.mocked(prismaService.client.productPhoto.findUniqueOrThrow).mockResolvedValue({
        ...mockPhoto,
        storedFile: mockStoredFile,
        product: { id: 1, imageUrl: "/product-photo/download/other" },
      } as never);

      await service.deleteProductPhoto(10);

      expect(txClient.productPhoto.findFirst).not.toHaveBeenCalled();
      expect(txClient.product.update).not.toHaveBeenCalled();
    });

    it("does not throw when unlinking fails", async () => {
      mockedUnlink.mockRejectedValue(new Error("ENOENT"));
      jest.mocked(prismaService.client.productPhoto.findUniqueOrThrow).mockResolvedValue({
        ...mockPhoto,
        storedFile: mockStoredFile,
        product: { id: 1, imageUrl: null },
      } as never);

      await expect(service.deleteProductPhoto(10)).resolves.toBeDefined();
    });
  });

  describe("downloadProductPhoto", () => {
    it("returns a StreamableFile for the stored record", async () => {
      jest.mocked(prismaService.client.storedFile.findUniqueOrThrow).mockResolvedValue(mockStoredFile as never);

      const result = await service.downloadProductPhoto("photo-1");

      expect(result).toBeInstanceOf(StreamableFile);
      expect(result.getHeaders()).toStrictEqual({
        type: "image/png",
        disposition: 'inline; filename="mouse.png"',
        length: undefined,
      });
      expect(mockedCreateReadStream).toHaveBeenCalledWith("/resolved/uploads/photo-1");
    });

    it("throws NotFoundException when the file is missing on disk", async () => {
      mockedResolveUploadPath.mockReturnValue(undefined);
      jest.mocked(prismaService.client.storedFile.findUniqueOrThrow).mockResolvedValue(mockStoredFile as never);

      await expect(service.downloadProductPhoto("photo-1")).rejects.toThrow(NotFoundException);
      expect(i18nService.t).toHaveBeenCalledWith("errors.common.fileNotFoundOnDisk", { args: { id: "photo-1" } });
    });

    it("propagates Prisma not-found error", async () => {
      const error = new Error("File not found");
      jest.mocked(prismaService.client.storedFile.findUniqueOrThrow).mockRejectedValue(error);

      await expect(service.downloadProductPhoto("missing")).rejects.toThrow(error);
    });
  });
});

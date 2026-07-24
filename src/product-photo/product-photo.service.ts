import { PrismaService } from "@/prisma/prisma.service";
import { normalizeUploadPath, resolveUploadPath } from "@/upload/resolve-upload-path";
import { Injectable, NotFoundException, StreamableFile } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import type { I18nTranslations } from "@/i18n/generated/i18n.generated";
import { logger } from "@/utils";

import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";

function downloadUrl(storedFileId: string) {
  return `/product-photo/download/${storedFileId}`;
}

@Injectable()
export class ProductPhotoService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async listByProduct(productId: number) {
    await this.prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const where = { productId };

    return await this.prisma.productPhoto.findMany({
      where,
      include: { storedFile: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async uploadProductPhoto(productId: number, creatorId: number, file: Express.Multer.File) {
    const product = await this.prisma.product.findUniqueOrThrow({ where: { id: productId } });

    const storedFile = await this.prisma.storedFile.create({
      data: {
        id: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: normalizeUploadPath(file.path, file.filename),
        size: file.size,
      },
    });

    const photo = await this.prisma.productPhoto.create({
      data: {
        productId,
        creatorId,
        storedFileId: storedFile.id,
      },
      include: { storedFile: true },
    });

    if (product.imageUrl == null) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { imageUrl: downloadUrl(storedFile.id) },
      });
    }

    return photo;
  }

  async deleteProductPhoto(photoId: number) {
    const photo = await this.prisma.productPhoto.findUniqueOrThrow({
      where: { id: photoId },
      include: { storedFile: true, product: { select: { id: true, imageUrl: true } } },
    });

    const deletedUrl = downloadUrl(photo.storedFileId);
    const resolvedPath =
      resolveUploadPath(photo.storedFile.path) ?? resolveUploadPath(path.posix.join("uploads", photo.storedFileId));

    await this.prisma.$transaction(async (tx) => {
      await tx.productPhoto.update({
        where: { id: photoId },
        data: { deletedAt: new Date() },
      });
      await tx.storedFile.update({
        where: { id: photo.storedFileId },
        data: { deletedAt: new Date() },
      });

      if (photo.product.imageUrl === deletedUrl) {
        const nextPhoto = await tx.productPhoto.findFirst({
          where: { productId: photo.productId, id: { not: photoId }, deletedAt: null },
          orderBy: { createdAt: "asc" },
        });
        await tx.product.update({
          where: { id: photo.productId },
          data: { imageUrl: nextPhoto ? downloadUrl(nextPhoto.storedFileId) : null },
        });
      }
    });

    if (resolvedPath != undefined) {
      try {
        await unlink(resolvedPath);
      } catch {
        logger.warn({ resolvedPath }, "Failed to delete product photo file (may already be missing)");
      }
    }

    return { message: this.i18n.t("responses.productPhoto.deleted", { args: { photoId: String(photoId) } }) };
  }

  async downloadProductPhoto(storedFileId: string) {
    const fileRecord = await this.prisma.storedFile.findUniqueOrThrow({
      where: { id: storedFileId },
    });

    const resolvedPath =
      resolveUploadPath(fileRecord.path) ?? resolveUploadPath(path.posix.join("uploads", storedFileId));

    if (resolvedPath == undefined) {
      throw new NotFoundException(this.i18n.t("errors.common.fileNotFoundOnDisk", { args: { id: storedFileId } }));
    }

    const file = createReadStream(resolvedPath);
    return new StreamableFile(file, {
      type: fileRecord.mimetype,
      disposition: `inline; filename="${fileRecord.originalname}"`,
    });
  }
}

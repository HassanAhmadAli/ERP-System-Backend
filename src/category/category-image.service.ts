import { PrismaService } from "@/prisma/prisma.service";
import { normalizeUploadPath, resolveUploadPath } from "@/upload/resolve-upload-path";
import { Injectable, NotFoundException, StreamableFile } from "@nestjs/common";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";

@Injectable()
export class CategoryImageService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async uploadCategoryImage(categoryId: number, file: Express.Multer.File) {
    const category = await this.prisma.category.findUniqueOrThrow({ where: { id: categoryId } });

    if (category.storedFileId) {
      await this.deleteCategoryImage(categoryId);
    }

    const storedFile = await this.prisma.storedFile.create({
      data: {
        id: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: normalizeUploadPath(file.path, file.filename),
        size: file.size,
      },
    });

    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        storedFileId: storedFile.id,
        imageUrl: `/category/image/download/${storedFile.id}`,
      },
    });
  }

  async deleteCategoryImage(categoryId: number) {
    const category = await this.prisma.category.findUniqueOrThrow({
      where: { id: categoryId },
      include: { storedFile: true },
    });

    if (!category.storedFileId || !category.storedFile) {
      return { message: `Category ${categoryId} has no image to delete` };
    }

    const resolvedPath =
      resolveUploadPath(category.storedFile.path) ??
      resolveUploadPath(path.posix.join("uploads", category.storedFileId));

    await this.prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: categoryId },
        data: { imageUrl: null, storedFileId: null },
      });
      await tx.storedFile.update({
        where: { id: category.storedFileId! },
        data: { deletedAt: new Date() },
      });
    });

    if (resolvedPath != undefined) {
      try {
        await unlink(resolvedPath);
      } catch {
        // file may already be missing on disk
      }
    }

    return { message: `Category image for ${categoryId} deleted successfully` };
  }

  async downloadCategoryImage(storedFileId: string) {
    const fileRecord = await this.prisma.storedFile.findUniqueOrThrow({
      where: { id: storedFileId },
    });

    const resolvedPath =
      resolveUploadPath(fileRecord.path) ?? resolveUploadPath(path.posix.join("uploads", storedFileId));

    if (resolvedPath == undefined) {
      throw new NotFoundException(`File not found on disk for id ${storedFileId}`);
    }

    const file = createReadStream(resolvedPath);
    return new StreamableFile(file, {
      type: fileRecord.mimetype,
      disposition: `inline; filename="${fileRecord.originalname}"`,
    });
  }
}

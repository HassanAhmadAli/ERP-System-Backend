import { PrismaService } from "@/prisma";
import { normalizeUploadPath, resolveUploadPath } from "@/upload/resolve-upload-path";
import { Injectable, NotFoundException, StreamableFile } from "@nestjs/common";
import { createReadStream } from "node:fs";
import path from "node:path";

@Injectable()
export class ProductPhotoService {
  constructor(private readonly prismaService: PrismaService) {}

  public get prisma() {
    return this.prismaService.client;
  }

  async uploadProductPhoto(productId: number, creatorId: number, file: Express.Multer.File) {
    await this.prisma.product.findUniqueOrThrow({ where: { id: productId } });

    const storedFile = await this.prisma.storedFile.create({
      data: {
        id: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: normalizeUploadPath(file.path, file.filename),
        size: file.size,
      },
    });

    return this.prisma.productPhoto.create({
      data: {
        productId,
        creatorId,
        storedFileId: storedFile.id,
      },
      include: { storedFile: true },
    });
  }

  async downloadProductPhoto(storedFileId: string) {
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

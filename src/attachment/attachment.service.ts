import { PrismaService } from "@/prisma";
import { Injectable, StreamableFile } from "@nestjs/common";
import { createReadStream } from "node:fs";
@Injectable()
export class AttachmentService {
  constructor(private readonly prismaService: PrismaService) {}
  public get prisma() {
    return this.prismaService.client;
  }
  async uploadFile(file: Express.Multer.File) {
    return await this.prisma.storedFile.create({
      data: {
        id: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
      },
    });
  }
  async downloadFile(id: string) {
    const fileRecord = await this.prisma.storedFile.findUniqueOrThrow({
      where: { id },
    });
    const file = createReadStream(fileRecord.path);
    return new StreamableFile(file, {
      type: fileRecord.mimetype,
      disposition: `attachment; filename="${fileRecord.originalname}"`,
    });
  }
}

import { UploadedFile, UseInterceptors, Controller, Get, Post, Param } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { PrismaService } from "@/prisma";
import { Public } from "@/common/decorators/public.decorator";
import { FileMimeStandarizingPipe } from "./pipe/file-mime-standarnizing.pipe";

@Controller("attachment")
export class AttachmentController {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly prismaService: PrismaService,
  ) {}
  public get prisma() {
    return this.prismaService.client;
  }

  @Public()
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile(new FileMimeStandarizingPipe())
    file: Express.Multer.File,
  ) {
    return await this.attachmentService.uploadFile(file);
  }

  @Get("download/:id")
  async downloadFile(@Param("id") id: string) {
    return await this.attachmentService.downloadFile(id);
  }
}

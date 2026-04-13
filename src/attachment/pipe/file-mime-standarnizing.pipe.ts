import { logger } from "@/utils";
import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { fileTypeFromFile, fileTypeFromBuffer } from "file-type";
@Injectable()
export class FileMimeStandarizingPipe implements PipeTransform {
  private undetectableMimeRegex =
    /^(text\/(plain|csv|html|jsx|css|javascript|markdown|calendar|xml)|application\/(json|xml|yaml|x-yaml|graphql|ld\+json|rtf|x-sh|x-php|ecmascript|octet-stream|javascript))($|;.*)/i;
  async transform(file?: Express.Multer.File) {
    if (file == undefined) {
      return file;
    }
    if (file.path) {
      try {
        return await this.checkFromPath(file);
      } catch {
        throw new BadRequestException("File verification failed.");
      }
    }
    if (file.buffer) {
      return await this.checkFromBuffer(file);
    }
    file.mimetype = "application/octet-stream";
    return file;
  }
  private async checkFromPath(file: Express.Multer.File) {
    const fileTypeResult = await fileTypeFromFile(file.path);
    return this.validateMime(file, fileTypeResult?.mime);
  }
  private async checkFromBuffer(file: Express.Multer.File) {
    const fileTypeResult = await fileTypeFromBuffer(file.buffer);
    return this.validateMime(file, fileTypeResult?.mime);
  }
  private validateMime(file: Express.Multer.File, realMime: string | undefined) {
    const clientClaimedMime = file.mimetype;
    if (!realMime) {
      if (this.undetectableMimeRegex.test(clientClaimedMime)) {
        return file;
      }
      file.mimetype = "application/octet-stream";
      logger.warn(`MimeType unknown , defaulting to ${file.mimetype} `);
      return file;
    }
    if (realMime !== clientClaimedMime) {
      logger.warn(`MimeType mismatch detected. Client: ${clientClaimedMime}, Real: ${realMime}. Overwriting.`);
      file.mimetype = realMime;
    }
    return file;
  }
}

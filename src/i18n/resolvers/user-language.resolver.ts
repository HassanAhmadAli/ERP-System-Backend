import { ExecutionContext, Injectable } from "@nestjs/common";
import { I18nResolver } from "nestjs-i18n";
import { RequestWithActiveUser } from "@/common/decorators/ActiveUser.decorator";

@Injectable()
export class UserLanguageResolver implements I18nResolver {
  resolve(context: ExecutionContext) {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithActiveUser>();
    const authHeader = req.headers.authorization;
    if (authHeader == undefined) return undefined;
    const token = authHeader.split(" ")[1];
    return this.decodeLanguageFromToken(token);
  }
  private decodeLanguageFromToken(token: string | undefined) {
    if (token == undefined) return undefined;
    const payload = this.parseBase64(token);
    if (
      payload != undefined &&
      typeof payload === "object" &&
      "language" in payload &&
      typeof payload.language === "string"
    ) {
      return payload.language;
    }
    return undefined;
  }
  private parseBase64(token: string) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return undefined;
      const payloadBase64 = parts[1];
      if (!payloadBase64) return undefined;
      const decodedJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
      return JSON.parse(decodedJson);
    } catch {
      return undefined;
    }
  }
}

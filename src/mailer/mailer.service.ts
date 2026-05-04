import { EnvVariables } from "@/common/schema/env";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService<EnvVariables>) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get("APP_EMAIL_HOST", { infer: true }),
      auth: {
        user: this.configService.get("APP_EMAIL_User", { infer: true }),
        pass: this.configService.get("APP_EMAIL_Password", { infer: true }),
      },
    });
  }

  async sendMail({ to, subject, text }: { to: string; subject: string; text: string }) {
    const sender = this.configService.get("APP_EMAIL_User", { infer: true });
    await this.transporter.sendMail({
      from: `"ERP System" <${sender}>`,
      to,
      subject,
      html: text,
    });
  }
}

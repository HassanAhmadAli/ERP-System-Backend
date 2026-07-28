import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "@/common/schema/env";
import { MailerService } from "./mailer.service";

// eslint-disable-next-line no-var
var createTransportMock: jest.Mock;
jest.mock("nodemailer", () => {
  createTransportMock = jest.fn();
  return { createTransport: createTransportMock };
});

describe("MailerService", () => {
  let service: MailerService;
  let configService: jest.Mocked<ConfigService<EnvVariables>>;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    configService = mock<ConfigService<EnvVariables>>();
    sendMailMock = jest.fn();
    createTransportMock.mockReturnValue({ sendMail: sendMailMock });

    configService.get.mockImplementation((key: string) => {
      if (key === "APP_EMAIL_HOST") return "smtp.example.com";
      if (key === "APP_EMAIL_User") return "noreply@example.com";
      if (key === "APP_EMAIL_Password") return "s3cret";
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerService, { provide: ConfigService, useValue: configService }],
    }).compile();

    service = module.get(MailerService);
  });

  it("creates transporter with config values on construction", () => {
    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.example.com",
      auth: {
        user: "noreply@example.com",
        pass: "s3cret",
      },
    });
  });

  describe("sendMail", () => {
    it("sends email via transporter with correct fields", async () => {
      sendMailMock.mockResolvedValue({ messageId: "123" });

      await service.sendMail({
        to: "user@example.com",
        subject: "Hello",
        text: "<p>Body</p>",
      });

      expect(sendMailMock).toHaveBeenCalledWith({
        from: '"ERP System" <noreply@example.com>',
        to: "user@example.com",
        subject: "Hello",
        html: "<p>Body</p>",
      });
    });
  });
});

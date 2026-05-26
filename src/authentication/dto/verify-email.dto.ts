import { z } from "zod";
import { openapiMeta } from "@/openapi/meta";
import { createZodDto } from "nestjs-zod";

export const VerifyEmailSchema = openapiMeta(
  z.object({
    email: z.email(),
    code: z.string().length(8),
  }),
  "VerifyEmailDto",
  { email: "someone@example.com", code: "12345678" },
);
export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}

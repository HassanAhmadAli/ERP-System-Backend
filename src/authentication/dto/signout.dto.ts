import { createZodDto } from "nestjs-zod";
import { openapiMeta } from "@/openapi/meta";
import { z } from "zod";

export const SignoutSchema = openapiMeta(
  z.object({
    refresh_token: z.string(),
  }),
  "SignoutDto",
  { refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh" },
);
export class SignoutDto extends createZodDto(SignoutSchema) {}

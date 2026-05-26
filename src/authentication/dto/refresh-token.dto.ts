import { createZodDto } from "nestjs-zod";
import { openapiMeta } from "@/openapi/meta";
import { z } from "zod";

export const RefreshTokenSchema = openapiMeta(
  z.object({
    refresh_token: z.string().nonempty(),
  }),
  "RefreshTokenDto",
  { refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh" },
);
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

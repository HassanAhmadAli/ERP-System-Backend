import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { openapiMeta } from "../meta";

export const AuthTokensSchema = openapiMeta(
  z.object({
    access_token: z.string(),
    refresh_token: z.string(),
  }),
  "AuthTokens",
  {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example",
    refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh",
  },
);
export class AuthTokensDto extends createZodDto(AuthTokensSchema) {}

export const MessageResponseSchema = openapiMeta(
  z.object({
    message: z.string(),
  }),
  "MessageResponse",
  { message: "Operation completed successfully" },
);
export class MessageResponseDto extends createZodDto(MessageResponseSchema) {}

export const HealthResponseSchema = openapiMeta(
  z.object({
    status: z.literal("ok"),
  }),
  "HealthResponse",
  { status: "ok" },
);
export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}

export const PaginatedMetaSchema = openapiMeta(
  z.object({
    total: z.number().int(),
  }),
  "PaginatedMeta",
  { total: 42 },
);

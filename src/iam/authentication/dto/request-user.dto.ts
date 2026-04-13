import { Role } from "@/prisma";
import { z } from "zod";

export const RefreshTokenPayloadSchema = z.object({
  sub: z.number(),
  tokenType: z.literal("refresh").default("refresh"),
  refreshTokenId: z.string(),
});

export const ActiveUserSchema = z.object({
  sub: z.number(),
  email: z.email(),
  role: z.enum(Role),
  tokenType: z.literal("access").default("access"),
});
export type ActiveUserInput = z.input<typeof ActiveUserSchema>;
export type ActiveUserType = z.infer<typeof ActiveUserSchema>;
export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>;

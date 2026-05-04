import { createZodDto } from "nestjs-zod";
import { z } from "zod";
export const SignoutSchema = z.object({
  password: z.string(),
  refreshToken: z.string(),
});
export class SignoutDto extends createZodDto(SignoutSchema) {}

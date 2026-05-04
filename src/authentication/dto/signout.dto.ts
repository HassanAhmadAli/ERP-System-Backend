import { createZodDto } from "nestjs-zod";
import { z } from "zod";
export const SignoutSchema = z.object({
  refresh_token: z.string(),
});
export class SignoutDto extends createZodDto(SignoutSchema) {}

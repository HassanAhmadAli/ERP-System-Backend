import { createZodDto } from "nestjs-zod";
import { z } from "zod";
export const refreshTokenSchema = z.object({
  refresh_token: z.string().nonempty(),
});
export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}

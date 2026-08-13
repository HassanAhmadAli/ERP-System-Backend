import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const UpdateLanguageSchema = z.object({
  language: z.enum(["en", "ar"]),
});

export class UpdateLanguageDto extends createZodDto(UpdateLanguageSchema) {}

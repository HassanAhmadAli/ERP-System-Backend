import { z } from "zod";
import { createZodDto } from "nestjs-zod";
export const CreateAttachmentSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  destination: z.string(),
  filename: z.string(),
  path: z.string(),
  size: z.coerce.string(),
});

export class CreateAttachmentDto extends createZodDto(CreateAttachmentSchema) {}

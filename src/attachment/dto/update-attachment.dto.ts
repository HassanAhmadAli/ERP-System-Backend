import { CreateAttachmentSchema } from "./create-attachment.dto";
import { createZodDto } from "nestjs-zod";
export const UpdateAttachmentSchema = CreateAttachmentSchema.partial();
export class UpdateAttachmentDto extends createZodDto(UpdateAttachmentSchema) {}

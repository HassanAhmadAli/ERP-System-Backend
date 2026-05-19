import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const MarkReadSchem = z.object({
  messageId: z.coerce.number().int().array(),
});

export class MarkReadDto extends createZodDto(MarkReadSchem) {}

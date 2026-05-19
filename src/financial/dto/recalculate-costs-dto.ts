import { z } from "zod";
import { createZodDto } from "nestjs-zod";
export const RecalculateCostsSchema = z.object({
  productIds: z.array(z.coerce.number().int()).optional(),
});

export class RecalculateCostsDto extends createZodDto(RecalculateCostsSchema) {}

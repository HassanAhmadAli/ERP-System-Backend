import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const PaginationQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    offset: z.coerce.number().int().min(0).default(0),
    deleted: z.stringbool().default(false),
  })
  .transform((val) => {
    return {
      ...val,
      deletedAt: val.deleted ? { not: null } : null,
    };
  });
export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

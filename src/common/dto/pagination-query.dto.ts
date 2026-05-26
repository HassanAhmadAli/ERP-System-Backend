import { createZodDto } from "nestjs-zod";
import { openapiMeta } from "@/openapi/meta";
import { z } from "zod";

export const PaginationQuerySchema = openapiMeta(
  z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    offset: z.coerce.number().int().min(0).default(0),
    deleted: z.stringbool().default(false),
  }),
  "PaginationQueryDto",
  { limit: 10, offset: 0, deleted: false },
);
export function deletedAt(deleted: boolean) {
  return deleted ? { not: null } : null;
}
export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

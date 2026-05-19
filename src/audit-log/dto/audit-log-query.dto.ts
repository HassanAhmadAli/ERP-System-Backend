import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";
import { stringToDateSchema } from "@/common/schema/date.schema";

export const AuditLogQuerySchema = PaginationQuerySchema.extend({
  userId: z.coerce.number().int().positive().optional(),
  entity: z.string().optional(),
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});

export class AuditLogQueryDto extends createZodDto(AuditLogQuerySchema) {}

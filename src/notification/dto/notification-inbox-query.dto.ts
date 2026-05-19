import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";

export const NotificationInboxQuerySchema = PaginationQuerySchema.extend({
  unreadOnly: z.stringbool().default(false),
});

export class NotificationInboxQueryDto extends createZodDto(NotificationInboxQuerySchema) {}

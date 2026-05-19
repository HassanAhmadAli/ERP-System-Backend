import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";

export const FindAllAdQuerySchema = PaginationQuerySchema.extend({
  activeOnly: z.stringbool().default(false),
});
export class FindAllAdQueryDto extends createZodDto(FindAllAdQuerySchema) {}

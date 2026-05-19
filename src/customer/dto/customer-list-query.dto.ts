import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";

export const CustomerListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});
export class CustomerListQueryDto extends createZodDto(CustomerListQuerySchema) {}

import { createZodDto } from "nestjs-zod";
import { PaginationQuerySchema } from "./pagination-query.dto";
import z from "zod";

export const SearchQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export class SearchQueryDto extends createZodDto(SearchQuerySchema) {}

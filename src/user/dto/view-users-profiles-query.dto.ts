import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";
import { createZodDto } from "nestjs-zod";
import z from "zod";
const viewUsersProfilesQuerySchema = PaginationQuerySchema.extend({
  role: z.string().optional(),
});
export class viewUsersProfilesQueryDto extends createZodDto(viewUsersProfilesQuerySchema) {}

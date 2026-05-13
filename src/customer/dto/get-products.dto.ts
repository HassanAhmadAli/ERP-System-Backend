import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const GetProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

export class GetProductsDto extends createZodDto(GetProductsSchema) {}

import { createZodDto } from "nestjs-zod";
import z from "zod";

const UpdateStockSchema = z.object({
  quantityInStock: z.coerce.number().int(),
});
export class UpdateStockDto extends createZodDto(UpdateStockSchema) {}

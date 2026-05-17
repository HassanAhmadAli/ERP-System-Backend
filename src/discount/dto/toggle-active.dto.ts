import { createZodDto } from "nestjs-zod";
import z from "zod";

const ToggleActiveDiscountSchema = z.object({
  isActive: z.boolean(),
});
export class ToggleActiveDiscountDto extends createZodDto(ToggleActiveDiscountSchema) {}

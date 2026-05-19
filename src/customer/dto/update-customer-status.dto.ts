import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const UpdateCustomerStatusSchema = z.object({
  isActive: z.boolean(),
});

export class UpdateCustomerStatusDto extends createZodDto(UpdateCustomerStatusSchema) {}

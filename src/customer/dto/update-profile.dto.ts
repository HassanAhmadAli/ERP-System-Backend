import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const UpdateCustomerProfileSchema = z.object({
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export class UpdateCustomerProfileDto extends createZodDto(UpdateCustomerProfileSchema) {}

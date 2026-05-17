import { phoneNumberSchema } from "@/common/schema/phone-number.schema";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const UpdateCustomerProfileSchema = z.object({
  fullName: z.string().optional(),
  phoneNumber: phoneNumberSchema.optional(),
  address: z.string().optional(),
});

export class UpdateCustomerProfileDto extends createZodDto(UpdateCustomerProfileSchema) {}

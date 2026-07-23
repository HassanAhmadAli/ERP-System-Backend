import { phoneNumberSchema } from "@/common/schema/phone-number.schema";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const UpdateCustomerProfileSchema = z.object({
  fullName: z.string().optional(),
  fullNameAr: z.string().optional(),
  phoneNumber: phoneNumberSchema.optional(),
  address: z.string().optional(),
  addressAr: z.string().optional(),
  language: z.enum(["en", "ar"]).optional(),
});

export class UpdateCustomerProfileDto extends createZodDto(UpdateCustomerProfileSchema) {}

import "@/common/env";
import { phoneNumberSchema } from "@/common/schema/phone-number.schema";
import { z } from "zod";

export const CreateUserSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  phoneNumber: phoneNumberSchema.optional(),
  password: z.string(),
  nationalId: z.string(),
});

export const CreateCustomerSchema = CreateUserSchema.extend({
  phoneNumber: phoneNumberSchema,
  address: z.string().optional(),
});

export const CreateEmployeeSchema = CreateUserSchema.extend({
  jobTitle: z.string(),
});

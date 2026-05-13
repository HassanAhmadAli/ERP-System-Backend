import "@/common/env";
import { z } from "zod";

export const CreateUserSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  phoneNumber: z.string().optional(),
  password: z.string(),
  nationalId: z.string(),
});

export const CreateCustomerSchema = CreateUserSchema.extend({
  phoneNumber: z.string(),
  address: z.string().optional(),
});

import { phoneNumberSchema } from "@/common/schema/phone-number.schema";
import { z } from "zod";

export const CreateSupplierSchema = z.object({
  fullName: z.string().min(2),
  fullNameAr: z.string().min(2).optional(),
  phone: phoneNumberSchema.optional(),
  email: z.email().optional(),
  address: z.string().optional(),
  addressAr: z.string().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

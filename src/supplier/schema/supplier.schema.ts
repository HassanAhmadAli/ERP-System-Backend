import { z } from "zod";

export const CreateSupplierSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.email().optional(),
  address: z.string().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

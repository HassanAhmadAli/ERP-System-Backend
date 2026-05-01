import "@/common/env";
import { z } from "zod";
import { UserRole } from "@/prisma";

export const CreateUserSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  phoneNumber: z.string(),
  password: z.string(),
  nationalId: z.string(),
  role: z.enum(UserRole).exclude([UserRole.EMPLOYEE]),
});
export const CreateEmployeeSchema = CreateUserSchema.extend({
  role: z.enum([UserRole.EMPLOYEE]),
});

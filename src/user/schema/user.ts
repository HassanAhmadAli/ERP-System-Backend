import "@/common/env";
import { z } from "zod";
import { Role } from "@/prisma";
import { InternalServerErrorException } from "@nestjs/common";
import { env } from "@/common/env";

export const CreateUserSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  phoneNumber: z.string(),
  password: z.string(),
  nationalId: z.string(),
  role: z
    .enum(Role)
    .exclude([Role.Employee])
    .refine((role) => {
      if (role === Role.Debugging && env!.NODE_ENV !== "development") {
        throw new InternalServerErrorException("using illegal role");
      }
      return role;
    }),
});
export const CreateEmployeeSchema = CreateUserSchema.extend({
  role: z.enum([Role.Employee, Role.Debugging]).refine((role) => {
    if (role === Role.Debugging && env!.NODE_ENV !== "development") {
      throw new InternalServerErrorException("using illegal role");
    }
    return role;
  }),
});

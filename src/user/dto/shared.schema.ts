import "@/common/env";
import { phoneNumberSchema } from "@/common/schema/phone-number.schema";
import { UserRole } from "@/prisma";
import { z } from "zod";
import _ from "lodash";
const staffRoles = _.omit(UserRole, ["CUSTOMER"]);

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

export const CreateStaffSchema = CreateUserSchema.extend({
  jobTitle: z.string(),
  role: z.enum(staffRoles),
});

import "@/common/env";
import { phoneNumberSchema } from "@/common/schema/phone-number.schema";
import { SEED } from "@/openapi/examples";
import { openapiMeta } from "@/openapi/meta";
import { UserRole } from "@/prisma/client";
import { z } from "zod";
import _ from "lodash";
const staffRoles = _.omit(UserRole, ["CUSTOMER"]);

export const CreateUserSchema = z.object({
  fullName: z.string(),
  fullNameAr: z.string().optional(),
  email: z.email(),
  phoneNumber: phoneNumberSchema.optional(),
  password: z.string(),
  nationalId: z.string(),
  language: z.enum(["en", "ar"]).optional(),
});
export const UpdateUserProfileSchema = CreateUserSchema.omit({ password: true }).partial().strict().extend({});

export const CreateCustomerSchema = openapiMeta(
  CreateUserSchema.extend({
    phoneNumber: phoneNumberSchema,
    address: z.string().optional(),
    addressAr: z.string().optional(),
  }),
  "CustomerSignupDto",
  {
    fullName: "Jane Customer",
    fullNameAr: "جين كاستمر",
    email: "jane.customer@example.com",
    phoneNumber: "+12025550199",
    password: SEED.password,
    nationalId: "0000000099",
    address: "456 Oak Ave",
    addressAr: "456 أوك أفينيو",
  },
);

export const CreateStaffSchema = openapiMeta(
  CreateUserSchema.extend({
    jobTitle: z.string(),
    jobTitleAr: z.string().optional(),
    role: z.enum(staffRoles),
  }),
  "CreateStaffDto",
  {
    fullName: "New Cashier",
    fullNameAr: "موظف جديد",
    email: "new.cashier@example.com",
    phoneNumber: "+12025550200",
    password: SEED.password,
    nationalId: "0000000100",
    jobTitle: "Cashier",
    jobTitleAr: "أمين صندوق",
    role: UserRole.CASHIER,
  },
);

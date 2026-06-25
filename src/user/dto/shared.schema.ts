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
  email: z.email(),
  phoneNumber: phoneNumberSchema.optional(),
  password: z.string(),
  nationalId: z.string(),
});

export const CreateCustomerSchema = openapiMeta(
  CreateUserSchema.extend({
    phoneNumber: phoneNumberSchema,
    address: z.string().optional(),
  }),
  "CustomerSignupDto",
  {
    fullName: "Jane Customer",
    email: "jane.customer@example.com",
    phoneNumber: "+12025550199",
    password: SEED.password,
    nationalId: "0000000099",
    address: "456 Oak Ave",
  },
);

export const CreateStaffSchema = openapiMeta(
  CreateUserSchema.extend({
    jobTitle: z.string(),
    role: z.enum(staffRoles),
  }),
  "CreateStaffDto",
  {
    fullName: "New Cashier",
    email: "new.cashier@example.com",
    phoneNumber: "+12025550200",
    password: SEED.password,
    nationalId: "0000000100",
    jobTitle: "Cashier",
    role: UserRole.CASHIER,
  },
);

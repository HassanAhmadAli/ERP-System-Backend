import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const phoneNumberSchema = z.string().transform((phoneStr, ctx) => {
  phoneStr = phoneStr.replace(/\s+/g, "");

  const phoneNumber = parsePhoneNumberFromString(phoneStr, "SY");

  if (!phoneNumber || !phoneNumber.isValid()) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid phone number",
    });
    return z.NEVER;
  }

  return phoneNumber.number;
});

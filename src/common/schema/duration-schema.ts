import { z } from "zod";

const units = [
  "Years",
  "Year",
  "Yrs",
  "Yr",
  "Y",
  "Weeks",
  "Week",
  "W",
  "Days",
  "Day",
  "D",
  "Hours",
  "Hour",
  "Hrs",
  "Hr",
  "H",
  "Minutes",
  "Minute",
  "Mins",
  "Min",
  "M",
  "Seconds",
  "Second",
  "Secs",
  "Sec",
  "s",
  "Milliseconds",
  "Millisecond",
  "Msecs",
  "Msec",
  "Ms",
] as const;
type Unit = (typeof units)[number];
type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;
type StringValue = `${number}` | `${number}${UnitAnyCase}` | `${number} ${UnitAnyCase}`;
const regex = new RegExp(`^\\d+(?:\\.\\d+)?(?:\\s?(?:${units.join("|")}))?$`, "i");

export const durationSchema = z.union([
  z.number(),
  z
    .string()
    .regex(regex, {
      message: "Invalid duration. Examples: 60, 1h, 1.5 hours, 100 ms",
    })
    .transform((arg) => arg as StringValue),
]);
export type DurationType = z.infer<typeof durationSchema>;

import { z } from "zod";

const units = ["y", "w", "d", "h", "m", "s", "ms"] as const;
const unitMultipliers: Record<Unit, number> = {
  ms: 1,
  s: 1_000,
  m: 1_000 * 60,
  h: 1_000 * 60 * 60,
  d: 1_000 * 60 * 60 * 24,
  w: 1_000 * 60 * 60 * 24 * 7,
  y: 1_000 * 60 * 60 * 24 * 365,
};
type Unit = (typeof units)[number];
type UnitAnyCase = Unit | Uppercase<Unit>;
type StringValue = `${number}` | `${number}${UnitAnyCase}` | `${number} ${UnitAnyCase}`;
const regex = new RegExp(`^\\d+(?:\\.\\d+)?(?:\\s?(?:${units.join("|")}))?$`, "i");

export const durationSchema = z.union([
  z.number(),
  z
    .string()
    .toLowerCase()
    .regex(regex, {
      message: "Invalid duration. Examples: 60, 1h, 1.5 hours, 100 ms",
    })
    .transform((arg) => arg as StringValue),
]);
export type DurationType = z.infer<typeof durationSchema>;

export const durationToMs = (x: DurationType) => {
  if (typeof x === "number") return x;

  const match = x.match(/^([\d.]+)\s*([a-z]+)?$/);
  if (!match) return 0;

  const value = parseFloat(match[1]!);
  const unit = match[2] as Unit | undefined;

  if (!unit) return value;

  return Math.round(value * unitMultipliers[unit]);
};

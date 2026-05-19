import { createZodDto } from "nestjs-zod";
import { Prisma } from "@/prisma";
import { z } from "zod";
export const UpdateLoyaltyPolicySchema = z.object({
  pointsPerCurrency: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x)),
  currencyPerPoint: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x)),
});

export class UpdateLoyaltyPolicyDto extends createZodDto(UpdateLoyaltyPolicySchema) {}

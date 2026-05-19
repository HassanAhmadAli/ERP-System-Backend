import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const AdjustCustomerLoyaltySchema = z.object({
  points: z.coerce.number().int(),
  reason: z.string().min(1).max(500).nullish(),
});

export class AdjustCustomerLoyaltyDto extends createZodDto(AdjustCustomerLoyaltySchema) {}

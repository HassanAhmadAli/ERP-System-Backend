import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const SetLoyaltyPolicySchema = z.object({
  pointsPerCurrency: z.number().positive().max(1_000_000),
});

export class SetLoyaltyPolicyDto extends createZodDto(SetLoyaltyPolicySchema) {}

export class LoyaltyPolicyResponseDto {
  pointsPerCurrency!: number;
  currencyPerPoint!: number;
  updatedAt!: Date;
}

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const RedeemLoyaltyOfferSchema = z.object({
  offerId: z.string(),
});

export class RedeemLoyaltyOfferDto extends createZodDto(RedeemLoyaltyOfferSchema) {}

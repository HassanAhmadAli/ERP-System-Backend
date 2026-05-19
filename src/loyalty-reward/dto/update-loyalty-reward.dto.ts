import { createZodDto } from "nestjs-zod";
import { UpdateLoyaltyRewardSchema } from "../schema/loyalty-reward.schema";

export class UpdateLoyaltyRewardDto extends createZodDto(UpdateLoyaltyRewardSchema) {}

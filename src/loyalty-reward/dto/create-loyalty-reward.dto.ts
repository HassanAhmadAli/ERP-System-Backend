import { createZodDto } from "nestjs-zod";
import { CreateLoyaltyRewardSchema } from "../schema/loyalty-reward.schema";

export class CreateLoyaltyRewardDto extends createZodDto(CreateLoyaltyRewardSchema) {}

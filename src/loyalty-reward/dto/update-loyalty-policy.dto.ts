import { createZodDto } from "nestjs-zod";
import { UpdateLoyaltyPolicySchema } from "../schema/loyalty-policy.schema";

export class UpdateLoyaltyPolicyDto extends createZodDto(UpdateLoyaltyPolicySchema) {}

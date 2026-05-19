import { createZodDto } from "nestjs-zod";
import { AdjustCustomerLoyaltySchema } from "../schema/customer-admin.schema";

export class AdjustCustomerLoyaltyDto extends createZodDto(AdjustCustomerLoyaltySchema) {}

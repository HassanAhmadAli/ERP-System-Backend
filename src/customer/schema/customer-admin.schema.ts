import { z } from "zod";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";

export const CustomerListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

export const AdjustCustomerLoyaltySchema = z.object({
  points: z.coerce.number().int(),
  reason: z.string().min(1).max(500).nullish(),
});

import { stringToDateSchema } from "@/common/schema/date.schema";
import z from "zod";

export const FinancialDateRangeSchema = z.object({
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});

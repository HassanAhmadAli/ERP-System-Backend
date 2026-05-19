import { stringToDateSchema } from "@/common/schema/date.schema";
import { z } from "zod";

export const ReportSummaryQuerySchema = z.object({
  from: stringToDateSchema.nullish(),
  to: stringToDateSchema.nullish(),
});

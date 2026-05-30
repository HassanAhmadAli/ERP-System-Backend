import { stringToDateSchema } from "@/common/schema/date.schema";
import { createZodDto } from "nestjs-zod";
import z from "zod";

const SalesDataSchema = z.object({
  date: stringToDateSchema,
  quantity: z.coerce.number(),
});
export class SalesDataDto extends createZodDto(SalesDataSchema) {}

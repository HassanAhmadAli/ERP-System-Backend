import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { AdPlacement } from "@/prisma";
import { stringToDateSchema } from "@/common/schema/date.schema";

export const UpdateAdSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  imageUrl: z.url().nullish(),
  linkUrl: z.url().nullish(),
  placement: z.enum(AdPlacement).optional(),
  isActive: z.boolean().optional(),
  startDate: stringToDateSchema.optional(),
  endDate: stringToDateSchema.optional(),
});
export class UpdateAdDto extends createZodDto(UpdateAdSchema) {}

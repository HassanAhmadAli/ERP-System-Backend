import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { AdPlacement } from "@/prisma/client";
import { stringToDateSchema } from "@/common/schema/date.schema";

export const CreateAdSchema = z.object({
  title: z.string().min(1).max(200),
  titleAr: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  descriptionAr: z.string().max(1000).optional(),
  imageUrl: z.url().nullish(),
  linkUrl: z.url().nullish(),
  placement: z.enum(AdPlacement).default("HOME"),
  isActive: z.boolean().default(true),
  startDate: stringToDateSchema,
  endDate: stringToDateSchema.optional(),
});
export class CreateAdDto extends createZodDto(CreateAdSchema) {}

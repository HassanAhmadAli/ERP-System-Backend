import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { DiscountScope, DiscountType, Prisma } from "@/prisma";
import { stringToDateSchema } from "@/common/schema/date.schema";

export const CreateDiscountSchema = z
  .object({
    name: z.string().min(2).max(100),
    type: z.enum(DiscountType),
    value: z.coerce
      .number()
      .positive()
      .transform((x) => new Prisma.Decimal(x)),
    scope: z.enum(DiscountScope),
    maxInvoiceValue: z.coerce
      .number()
      .min(0)
      .default(0)
      .transform((x) => new Prisma.Decimal(x)),
    maxUses: z.coerce.number().int().positive().optional(),
    startDate: stringToDateSchema,
    endDate: stringToDateSchema.optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate >= data.endDate) {
        return false;
      }
      return true;
    },
    { message: "endDate must be after startDate", path: ["endDate"] },
  );
export class CreateDiscountDto extends createZodDto(CreateDiscountSchema) {}

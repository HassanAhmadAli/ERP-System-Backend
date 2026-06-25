import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { DiscountScope, DiscountType, Prisma } from "@/prisma/client";
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
    productId: z.coerce.number().int().positive().nullish(),
    categoryId: z.coerce.number().int().positive().nullish(),
    customerId: z.coerce.number().int().positive().nullish(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate >= data.endDate) {
        return false;
      }
      return true;
    },
    { message: "endDate must be after startDate", path: ["endDate"] },
  )
  .refine(
    (data) => {
      if (data.scope === DiscountScope.PRODUCT && data.productId == undefined) {
        return false;
      }
      if (data.scope !== DiscountScope.PRODUCT && data.productId != undefined) {
        return false;
      }
      return true;
    },
    {
      message: "productId is required for PRODUCT scope and must not be provided for other scopes",
      path: ["productId"],
    },
  )
  .refine(
    (data) => {
      if (data.scope === DiscountScope.CATEGORY && data.categoryId == undefined) {
        return false;
      }
      if (data.scope !== DiscountScope.CATEGORY && data.categoryId != undefined) {
        return false;
      }
      return true;
    },
    {
      message: "categoryId is required for CATEGORY scope and must not be provided for other scopes",
      path: ["categoryId"],
    },
  )
  .refine(
    (data) => {
      if (data.scope === DiscountScope.CUSTOMER && data.customerId == undefined) {
        return false;
      }
      if (data.scope !== DiscountScope.CUSTOMER && data.customerId != undefined) {
        return false;
      }
      return true;
    },
    {
      message: "customerId is required for CUSTOMER scope and must not be provided for other scopes",
      path: ["customerId"],
    },
  )
  .refine(
    (data) => {
      if (data.type === "PERCENTAGE" && data.value.gt(100)) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount value cannot be greater than 100",
      path: ["value"],
    },
  );
export class CreateDiscountDto extends createZodDto(CreateDiscountSchema) {}

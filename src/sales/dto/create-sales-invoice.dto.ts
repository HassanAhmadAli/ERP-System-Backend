import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { Prisma } from "@/prisma";

export const SaleItemInputSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

export const CreateSalesInvoiceSchema = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  discountId: z.coerce.number().int().positive().nullish(),
  amountPaid: z.coerce
    .number()
    .min(0)
    .transform((x) => new Prisma.Decimal(x)),
  items: z.array(SaleItemInputSchema).min(1),
  complete: z.boolean().default(false),
});
export class CreateSalesInvoiceDto extends createZodDto(CreateSalesInvoiceSchema) {}

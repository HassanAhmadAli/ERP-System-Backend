import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { stringToDateSchema } from "@/common/schema/date.schema";
import { Prisma } from "@/prisma/client";
export const PurchaseItemInputSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x)),
  expiryDate: stringToDateSchema.optional(),
});
export const CreatePurchaseInvoiceSchema = z.object({
  supplierId: z.coerce.number().int().positive(),
  invoiceDate: stringToDateSchema,
  items: z.array(PurchaseItemInputSchema).min(1),
  receive: z.boolean().default(false),
});
export class CreatePurchaseInvoiceDto extends createZodDto(CreatePurchaseInvoiceSchema) {}

import { z } from "zod";
import { InvoiceStatus, Prisma } from "@/prisma";
import { stringToDateSchema } from "@/common/schema/date.schema";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";

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

export const UpdatePurchaseInvoiceStatusSchema = z.object({
  status: z.enum(InvoiceStatus),
});

export const PurchaseInvoiceQuerySchema = PaginationQuerySchema.extend({
  status: z.enum(InvoiceStatus).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});

import { z } from "zod";
import { InvoiceStatus, Prisma } from "@/prisma";
import { stringToDateSchema } from "@/common/schema/date.schema";
import { PaginationQuerySchema } from "@/common/dto/pagination-query.dto";

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

export const UpdateSalesInvoiceStatusSchema = z.object({
  status: z.enum(InvoiceStatus),
});

export const SalesInvoiceQuerySchema = PaginationQuerySchema.extend({
  status: z.enum(InvoiceStatus).optional(),
  cashierId: z.coerce.number().int().positive().optional(),
  from: stringToDateSchema.optional(),
  to: stringToDateSchema.optional(),
});

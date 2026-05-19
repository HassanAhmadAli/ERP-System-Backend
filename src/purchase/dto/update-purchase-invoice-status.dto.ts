import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { InvoiceStatus } from "@/prisma";

export const UpdatePurchaseInvoiceStatusSchema = z.object({
  status: z.enum(InvoiceStatus),
});
export class UpdatePurchaseInvoiceStatusDto extends createZodDto(UpdatePurchaseInvoiceStatusSchema) {}

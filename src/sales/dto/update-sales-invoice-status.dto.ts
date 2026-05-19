import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { InvoiceStatus } from "@/prisma";

export const UpdateSalesInvoiceStatusSchema = z.object({
  status: z.enum(InvoiceStatus),
});

export class UpdateSalesInvoiceStatusDto extends createZodDto(UpdateSalesInvoiceStatusSchema) {}

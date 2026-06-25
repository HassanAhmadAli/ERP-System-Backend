import { openapiMeta } from "@/openapi/meta";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { InvoiceStatus } from "@/prisma/client";

export const UpdateSalesInvoiceStatusSchema = openapiMeta(
  z.object({
    status: z.enum(InvoiceStatus),
  }),
  "UpdateSalesInvoiceStatusDto",
  { status: InvoiceStatus.COMPLETED },
);

export class UpdateSalesInvoiceStatusDto extends createZodDto(UpdateSalesInvoiceStatusSchema) {}

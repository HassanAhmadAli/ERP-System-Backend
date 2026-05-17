import { createZodDto } from "nestjs-zod";
import { PurchaseInvoiceQuerySchema } from "../schema/purchase-invoice.schema";

export class PurchaseInvoiceQueryDto extends createZodDto(PurchaseInvoiceQuerySchema) {}

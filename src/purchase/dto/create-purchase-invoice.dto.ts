import { createZodDto } from "nestjs-zod";
import { CreatePurchaseInvoiceSchema } from "../schema/purchase-invoice.schema";

export class CreatePurchaseInvoiceDto extends createZodDto(CreatePurchaseInvoiceSchema) {}

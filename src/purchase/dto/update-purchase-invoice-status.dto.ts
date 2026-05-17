import { createZodDto } from "nestjs-zod";
import { UpdatePurchaseInvoiceStatusSchema } from "../schema/purchase-invoice.schema";

export class UpdatePurchaseInvoiceStatusDto extends createZodDto(UpdatePurchaseInvoiceStatusSchema) {}

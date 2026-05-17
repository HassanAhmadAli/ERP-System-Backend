import { createZodDto } from "nestjs-zod";
import { SalesInvoiceQuerySchema } from "../schema/sales-invoice.schema";

export class SalesInvoiceQueryDto extends createZodDto(SalesInvoiceQuerySchema) {}

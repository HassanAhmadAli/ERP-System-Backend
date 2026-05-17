import { createZodDto } from "nestjs-zod";
import { CreateSalesInvoiceSchema } from "../schema/sales-invoice.schema";

export class CreateSalesInvoiceDto extends createZodDto(CreateSalesInvoiceSchema) {}

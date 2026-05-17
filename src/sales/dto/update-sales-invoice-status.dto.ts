import { createZodDto } from "nestjs-zod";
import { UpdateSalesInvoiceStatusSchema } from "../schema/sales-invoice.schema";

export class UpdateSalesInvoiceStatusDto extends createZodDto(UpdateSalesInvoiceStatusSchema) {}

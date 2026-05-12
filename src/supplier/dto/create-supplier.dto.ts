import { createZodDto } from "nestjs-zod";
import { CreateSupplierSchema } from "../schema/supplier.schema";

export class CreateSupplierDto extends createZodDto(CreateSupplierSchema) {}

import { createZodDto } from "nestjs-zod";
import { UpdateSupplierSchema } from "../schema/supplier.schema";

export class UpdateSupplierDto extends createZodDto(UpdateSupplierSchema) {}

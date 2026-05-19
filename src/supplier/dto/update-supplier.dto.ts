import { createZodDto } from "nestjs-zod";
import { UpdateSupplierSchema } from "./shared.schema";

export class UpdateSupplierDto extends createZodDto(UpdateSupplierSchema) {}

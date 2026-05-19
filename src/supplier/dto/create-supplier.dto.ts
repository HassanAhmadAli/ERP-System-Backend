import { createZodDto } from "nestjs-zod";
import { CreateSupplierSchema } from "./shared.schema";

export class CreateSupplierDto extends createZodDto(CreateSupplierSchema) {}

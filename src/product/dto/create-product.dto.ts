import { createZodDto } from "nestjs-zod";
import { CreateProductSchema } from "./shared.schema";

export class CreateProductDto extends createZodDto(CreateProductSchema) {}

import { createZodDto } from "nestjs-zod";
import { CreateProductSchema } from "../schema/product.schema";

export class CreateProductDto extends createZodDto(CreateProductSchema) {}

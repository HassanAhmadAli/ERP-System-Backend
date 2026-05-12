import { createZodDto } from "nestjs-zod";
import { CreateProductSchema } from "../schema/product.schema";
export const UpdateProductSchema = CreateProductSchema.partial();
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}

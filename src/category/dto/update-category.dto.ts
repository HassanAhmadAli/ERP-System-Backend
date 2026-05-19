import { createZodDto } from "nestjs-zod";
import { CreateCategorySchema } from "./shared.schema";

export const UpdateCategorySchema = CreateCategorySchema.partial();

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}

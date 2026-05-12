import { createZodDto } from "nestjs-zod";
import { UpdateCategorySchema } from "../schema/category.schema";

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}

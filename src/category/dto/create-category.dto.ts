import { createZodDto } from "nestjs-zod";
import { CreateCategorySchema } from "../schema/category.schema";

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}

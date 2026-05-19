import { createZodDto } from "nestjs-zod";
import { CreateCategorySchema } from "./shared.schema";

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}

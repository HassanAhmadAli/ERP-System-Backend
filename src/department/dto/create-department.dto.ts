import { z } from "zod";
import { createZodDto } from "nestjs-zod";

export const CreateDepartmentSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
});
export class CreateDepartmentDto extends createZodDto(CreateDepartmentSchema) {}

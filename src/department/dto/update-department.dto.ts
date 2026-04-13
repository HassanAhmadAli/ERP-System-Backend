import { CreateDepartmentSchema } from "./create-department.dto";
import { createZodDto } from "nestjs-zod";
export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();
export class UpdateDepartmentDto extends createZodDto(UpdateDepartmentSchema) {}

import { createZodDto } from "nestjs-zod";
import { CreateEmployeeSchema, CreateUserSchema } from "../schema/user";

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class CreateEmployeeDto extends createZodDto(CreateEmployeeSchema) {}

import { CreateCustomerSchema, CreateUserSchema, CreateEmployeeSchema } from "@/user/dto/shared.schema";
import { createZodDto } from "nestjs-zod";

export class SignupDto extends createZodDto(CreateUserSchema) {}
export class CustomerSignupDto extends createZodDto(CreateCustomerSchema) {}
export class EmployeeSignupDto extends createZodDto(CreateEmployeeSchema) {}

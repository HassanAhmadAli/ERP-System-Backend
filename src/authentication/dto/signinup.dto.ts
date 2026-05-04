import { CreateCustomerSchema, CreateUserSchema } from "@/user/schema/user";
import { createZodDto } from "nestjs-zod";

export class SignupDto extends createZodDto(CreateUserSchema) {}
export class CustomerSignupDto extends createZodDto(CreateCustomerSchema) {}

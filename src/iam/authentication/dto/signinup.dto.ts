import { CreateUserSchema } from "@/user/schema/user";
import { createZodDto } from "nestjs-zod";

export class SignupDto extends createZodDto(CreateUserSchema) {}

import { CreateUserSchema } from "@/user/dto/shared.schema";
import { createZodDto } from "nestjs-zod";

export class SignupDto extends createZodDto(CreateUserSchema) {}

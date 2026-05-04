import { createZodDto } from "nestjs-zod";
import { CreateUserSchema } from "../schema/user";

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

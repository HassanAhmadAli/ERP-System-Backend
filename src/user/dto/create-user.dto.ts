import { createZodDto } from "nestjs-zod";
import "@/common/env";
import { CreateUserSchema } from "./shared.schema";

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

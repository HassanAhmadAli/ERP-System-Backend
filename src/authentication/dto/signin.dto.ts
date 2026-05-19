import { CreateUserSchema } from "@/user/dto/shared.schema";
import { createZodDto } from "nestjs-zod";

export const SigninSchema = CreateUserSchema.pick({
  email: true,
  password: true,
});
export class SigninDto extends createZodDto(SigninSchema) {}

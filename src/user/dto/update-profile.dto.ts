import { createZodDto } from "nestjs-zod";
import { CreateUserSchema } from "../schema/user";
export const UpdateProfileSchema = CreateUserSchema.omit({
  password: true,
})
  .partial()
  .strict();
export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}

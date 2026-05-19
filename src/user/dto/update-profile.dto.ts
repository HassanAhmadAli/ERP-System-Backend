import { createZodDto } from "nestjs-zod";
import "@/common/env";
import { CreateUserSchema } from "./shared.schema";

export const UpdateProfileSchema = CreateUserSchema.omit({
  password: true,
})
  .partial()
  .strict();
export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}

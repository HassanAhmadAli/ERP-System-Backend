import { CreateUserSchema } from "@/user/dto/shared.schema";
import { SEED } from "@/openapi/examples";
import { openapiMeta } from "@/openapi/meta";
import { createZodDto } from "nestjs-zod";

export const SigninSchema = openapiMeta(
  CreateUserSchema.pick({
    email: true,
    password: true,
  }),
  "SigninDto",
  { email: SEED.cashierEmail, password: SEED.password },
);
export class SigninDto extends createZodDto(SigninSchema) {}

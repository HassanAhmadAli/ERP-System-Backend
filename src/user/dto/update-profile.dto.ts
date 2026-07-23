import { createZodDto } from "nestjs-zod";
import "@/common/env";
import { UpdateUserProfileSchema } from "./shared.schema";

export class UpdateProfileDto extends createZodDto(UpdateUserProfileSchema) {}

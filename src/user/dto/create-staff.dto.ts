import { createZodDto } from "nestjs-zod";
import { CreateStaffSchema } from "./shared.schema";

export class CreateStaffDto extends createZodDto(CreateStaffSchema) {}

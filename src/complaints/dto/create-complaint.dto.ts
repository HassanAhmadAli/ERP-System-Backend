import { createZodDto } from "nestjs-zod";
import { CreateComplaintSchema } from "../schema/complaint";

export class CreateComplaintDto extends createZodDto(CreateComplaintSchema) {}

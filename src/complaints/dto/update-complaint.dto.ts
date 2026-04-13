import { createZodDto } from "nestjs-zod";
import { CreateComplaintSchema } from "../schema/complaint";
export const UpdateComplaintSchema = CreateComplaintSchema.partial();
export class UpdateComplaintDto extends createZodDto(UpdateComplaintSchema) {}

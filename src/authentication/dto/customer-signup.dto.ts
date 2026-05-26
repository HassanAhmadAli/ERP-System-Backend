import { CreateCustomerSchema } from "@/user/dto/shared.schema";
import { createZodDto } from "nestjs-zod";

export class CustomerSignupDto extends createZodDto(CreateCustomerSchema) {}

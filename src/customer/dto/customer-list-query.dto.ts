import { createZodDto } from "nestjs-zod";
import { CustomerListQuerySchema } from "../schema/customer-admin.schema";

export class CustomerListQueryDto extends createZodDto(CustomerListQuerySchema) {}

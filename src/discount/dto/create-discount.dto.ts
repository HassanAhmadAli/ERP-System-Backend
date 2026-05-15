import { createZodDto } from "nestjs-zod";
import { CreateDiscountSchema } from "../schema/discount.schema";

export class CreateDiscountDto extends createZodDto(CreateDiscountSchema) {}

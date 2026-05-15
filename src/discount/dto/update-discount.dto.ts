import { createZodDto } from "nestjs-zod";
import { UpdateDiscountSchema } from "../schema/discount.schema";

export class UpdateDiscountDto extends createZodDto(UpdateDiscountSchema) {}

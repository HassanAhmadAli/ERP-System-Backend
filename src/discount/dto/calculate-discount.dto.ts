import { createZodDto } from "nestjs-zod";
import { CalculateDiscountSchema } from "../schema/discount.schema";

export class CalculateDiscountDto extends createZodDto(CalculateDiscountSchema) {}

import { createZodDto } from "nestjs-zod";
import { CreateOrderSchema } from "../schema/order.schema";

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}

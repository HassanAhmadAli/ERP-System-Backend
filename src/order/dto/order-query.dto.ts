import { createZodDto } from "nestjs-zod";
import { OrderQuerySchema } from "../schema/order.schema";

export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}

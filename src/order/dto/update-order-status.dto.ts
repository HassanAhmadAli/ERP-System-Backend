import { createZodDto } from "nestjs-zod";
import { UpdateOrderStatusSchema } from "../schema/order.schema";

export class UpdateOrderStatusDto extends createZodDto(UpdateOrderStatusSchema) {}

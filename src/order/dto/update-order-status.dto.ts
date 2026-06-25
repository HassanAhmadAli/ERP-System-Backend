import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { OrderStatus } from "@/prisma/client";
export const UpdateOrderStatusSchema = z.object({
  status: z.enum(OrderStatus),
});
export class UpdateOrderStatusDto extends createZodDto(UpdateOrderStatusSchema) {}

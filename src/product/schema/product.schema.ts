import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { Prisma } from "@/prisma";

export const CreateProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  barcode: z.string().min(3),
  purchasePrice: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x)),
  sellingPrice: z.coerce
    .number()
    .positive()
    .transform((x) => new Prisma.Decimal(x)),
  quantityInStock: z.coerce.number().int().min(0),
  minQuantity: z.coerce.number().int().min(0),
  categoryId: z.coerce.number().int(),
  supplierId: z.coerce.number().int(),
  imageUrl: z.url().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}

import { SEED } from "@/openapi/examples";
import { openapiMeta } from "@/openapi/meta";
import { z } from "zod";
import { Prisma } from "@/prisma";

export const CreateProductSchema = openapiMeta(
  z.object({
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
    categoryId: z.coerce.number().int().positive(),
    supplierId: z.coerce.number().int().positive(),
    imageUrl: z.url().optional(),
  }),
  "CreateProductDto",
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse",
    barcode: "100000000099",
    purchasePrice: 12.5,
    sellingPrice: 29.99,
    quantityInStock: 50,
    minQuantity: 5,
    categoryId: SEED.categoryId,
    supplierId: SEED.supplierId,
  },
);

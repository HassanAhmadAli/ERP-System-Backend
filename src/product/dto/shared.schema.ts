import { SEED } from "@/openapi/examples";
import { openapiMeta } from "@/openapi/meta";
import { z } from "zod";
import { Prisma } from "@/prisma/client";

export const CreateProductSchema = openapiMeta(
  z.object({
    name: z.string().min(2),
    nameAr: z.string().min(2).optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
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
    nameAr: "فأرة لاسلكية",
    description: "Ergonomic wireless mouse",
    descriptionAr: "فأرة لاسلكية مريحة",
    barcode: "100000000099",
    purchasePrice: 12.5,
    sellingPrice: 29.99,
    quantityInStock: 50,
    minQuantity: 5,
    categoryId: SEED.categoryId,
    supplierId: SEED.supplierId,
  },
);

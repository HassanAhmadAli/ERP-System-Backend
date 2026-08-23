import type { Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { PRODUCTS } from "./data/catalog";
import { stockOnHand } from "./inventory";

export const PRODUCT_COUNT = PRODUCTS.length;

export async function seedProducts(tx: PrismaTransactionClient) {
  const stock = stockOnHand();

  const data: Prisma.ProductCreateManyInput[] = PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    nameAr: product.nameAr,
    description: product.description,
    descriptionAr: product.descriptionAr,
    barcode: product.barcode,
    purchasePrice: String(product.purchasePrice),
    sellingPrice: String(product.sellingPrice),
    quantityInStock: stock.get(product.id) ?? 0,
    minQuantity: product.minQuantity,
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    imageUrl: null,
  }));

  await tx.product.createMany({ data });
}

import { join } from "./../../src/prisma/generated/prisma-client/internal/prismaNamespace";
import { prisma } from "./client-instance";
import { faker } from "@faker-js/faker";
export const productsData = [
  {
    id: 0,
    name: "example of product with low stuck",
    barcode: faker.number.int({ min: 111111111111, max: 999999999999 }).toString(),
    purchasePrice: faker.number.int({ min: 1, max: 200 }).toString(),
    sellingPrice: faker.number.int({ min: 201, max: 250 }).toString(),
    quantityInStock: 11,
    minQuantity: 12,
    description: faker.lorem.sentences(10).toString(),
    categoryId: 0,
    supplierId: 0,
  },
  {
    id: 1,
    name: faker.food.vegetable.name,
    barcode: faker.number.int({ min: 111111111111, max: 999999999999 }).toString(),
    purchasePrice: faker.number.int({ min: 1, max: 200 }).toString(),
    sellingPrice: faker.number.int({ min: 201, max: 250 }).toString(),
    quantityInStock: 14,
    minQuantity: 12,
    categoryId: 1,
    supplierId: 1,
  },
];

export async function seedProducts() {
  for (const item of productsData) {
    await prisma.product.create({
      data: item,
    });
  }
}

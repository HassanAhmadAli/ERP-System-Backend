import { prisma } from "./client-instance";

export const productsData = [
  {
    id: 1,
    name: "Wireless Mouse",
    barcode: "100000000001",
    purchasePrice: "15.00",
    sellingPrice: "29.99",
    quantityInStock: 11,
    minQuantity: 12,
    description: "Ergonomic wireless mouse (low stock sample)",
    categoryId: 1,
    supplierId: 1,
  },
  {
    id: 2,
    name: "Organic Carrots",
    barcode: "100000000002",
    purchasePrice: "2.50",
    sellingPrice: "4.99",
    quantityInStock: 120,
    minQuantity: 20,
    description: "Fresh organic carrots per kg",
    categoryId: 2,
    supplierId: 2,
  },
];

export async function seedProducts() {
  for (const item of productsData) {
    await prisma.product.create({ data: item });
  }
}

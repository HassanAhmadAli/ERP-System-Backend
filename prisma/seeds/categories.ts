import { prisma } from "./client-instance";

export const categoryData = [
  {
    id: 1,
    name: "electronics",
    description: "Electric utilities and devices",
  },
  {
    id: 2,
    name: "vegetables",
    description: "Fresh vegetables",
  },
];

export async function seedCategory() {
  for (const item of categoryData) {
    await prisma.category.create({ data: item });
  }
}

import { prisma } from "./client-instance";
export const categoryData = [
  {
    id: 0,
    description: "Electric Utilities",
    name: "electronics",
  },
  {
    id: 1,
    description: "vegetables",
    name: "vegetables",
  },
];

export async function seedCategory() {
  for (const item of categoryData) {
    await prisma.category.create({
      data: item,
    });
  }
}

import { prisma } from "./client-instance";
export const data = [
  {
    id: 1,
    name: "Electricity",
    description: "Electricity governemental department",
  },
  {
    id: 2,
    name: "Water",
    description: "Water governemental department",
  },
  {
    id: 3,
    name: "Internet",
    description: "Internet governemental department",
  },
  {
    id: 4,
    name: "Education",
    description: "Education governemental department",
  },
] as const;

export async function seedDepartments() {
  for (const department of data) {
    await prisma.department.create({
      data: department,
    });
  }
}

import { prisma } from "./client-instance";
import { faker } from "@faker-js/faker";
export const suppliersData = [
  {
    id: 0,
    address: faker.location.country(),
    email: faker.internet.email(),
    fullName: faker.person.fullName(),
    phone: faker.phone.number(),
  },
  {
    id: 1,
    address: faker.location.country(),
    email: faker.internet.email(),
    fullName: faker.person.fullName(),
    phone: faker.phone.number(),
  },
];

export async function seedSuppliers() {
  for (const item of suppliersData) {
    await prisma.supplier.create({
      data: item,
    });
  }
}

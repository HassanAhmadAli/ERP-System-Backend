import type { Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { faker } from "./data/generators";

export const SUPPLIER_COUNT = 25;

export function seedSuppliers(tx: PrismaTransactionClient) {
  const data: Prisma.SupplierCreateManyInput[] = Array.from({ length: SUPPLIER_COUNT }, (_, i) => ({
    id: i + 1,
    fullName: faker.company.name(),
    fullNameAr: null,
    phone: faker.phone.number({ style: "international" }),
    email: faker.internet.email().toLowerCase(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    addressAr: null,
  }));

  return tx.supplier.createMany({ data });
}

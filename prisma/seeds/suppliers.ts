import { prisma } from "./client-instance";

export const suppliersData = [
  {
    id: 1,
    fullName: "Acme Wholesale Co.",
    email: "contact@acmewholesale.example.com",
    phone: "+963911000001",
    address: "100 Industrial Park, Springfield",
  },
  {
    id: 2,
    fullName: "Green Valley Farms",
    email: "orders@greenvalley.example.com",
    phone: "+963911000002",
    address: "42 Orchard Lane, Riverside",
  },
];

export async function seedSuppliers() {
  for (const item of suppliersData) {
    await prisma.supplier.create({ data: item });
  }
}

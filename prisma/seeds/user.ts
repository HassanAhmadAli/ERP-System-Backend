import { UserRole } from "@/prisma/client";
import { getKeyOf } from "@/utils";
import { prisma } from "./client-instance";
import { HashingService } from "@/hashing/hashing.service";

export const usersData = {
  storeManager: {
    id: 1,
    email: "store.manager@example.com",
    fullName: "Maria Fritz",
    phoneNumber: "0900000001",
    nationalId: "0000000001",
    role: UserRole.STORE_MANAGER,
    password: "12345678",
    employeeId: 1,
  },
  cashier: {
    id: 3,
    email: "cashier.user@example.com",
    fullName: "Sina Fritz",
    phoneNumber: "0900000003",
    nationalId: "0000000003",
    role: UserRole.CASHIER,
    password: "12345678",
    employeeId: 2,
  },
  cashier2: {
    id: 6,
    email: "cashier2@example.com",
    fullName: "Levi Ackerman",
    phoneNumber: "0900000006",
    nationalId: "0000000006",
    role: UserRole.CASHIER,
    password: "12345678",
    employeeId: 5,
  },
  warehouseWorker: {
    id: 4,
    email: "warehouse.user@example.com",
    fullName: "Ymir Fritz",
    phoneNumber: "0900000004",
    nationalId: "0000000004",
    role: UserRole.WAREHOUSE_WORKER,
    password: "12345678",
    employeeId: 3,
  },
  accountant: {
    id: 5,
    email: "accountant.user@example.com",
    fullName: "Annie Leonhart",
    phoneNumber: "0900000005",
    nationalId: "0000000005",
    role: UserRole.ACCOUNTANT,
    password: "12345678",
    employeeId: 4,
  },
};

const customersData = [
  {
    id: 2,
    customerId: 1,
    email: "customer.user@example.com",
    fullName: "Rose Fritz",
    phoneNumber: "0900000002",
    nationalId: "0000000002",
    role: UserRole.CUSTOMER,
    password: "12345678",
    address: "123 Main St, Springfield",
  },
];

const employeeProfiles: Record<keyof typeof usersData, string> = {
  storeManager: "Store Manager",
  cashier: "Cashier",
  cashier2: "Cashier",
  warehouseWorker: "Warehouse Worker",
  accountant: "Accountant",
};

export async function seedUsers(hashingService: HashingService) {
  for (const key of getKeyOf(usersData)) {
    const { password, employeeId, ...userData } = usersData[key];
    const passwordHash = await hashingService.hash(password);
    await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        isVerified: true,
        isActive: true,
        employee: {
          create: {
            id: employeeId,
            jobTitle: employeeProfiles[key],
          },
        },
      },
    });
  }

  for (const customer of customersData) {
    const { password, address, customerId, ...userData } = customer;
    const passwordHash = await hashingService.hash(password);
    await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        isVerified: true,
        isActive: true,
        customer: {
          create: {
            id: customerId,
            address,
            loyaltyPoints: 150,
            totalSpent: "89.97",
          },
        },
      },
    });
  }
}

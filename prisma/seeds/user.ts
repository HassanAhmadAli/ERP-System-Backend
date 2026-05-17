import { UserRole } from "@/prisma";
import { getKeyOf } from "@/utils";
import { prisma } from "./client-instance";
import { HashingService } from "@/hashing/hashing.service";

export const usersData = {
  admin: {
    id: 1,
    email: "admin.user@example.com",
    fullName: "Maria Fritz",
    phoneNumber: "0900000001",
    nationalId: "0000000001",
    role: UserRole.ADMIN,
    password: "12345678",
    employeeId: 1,
  },
  employee: {
    id: 3,
    email: "employee.user@example.com",
    fullName: "Sina Fritz",
    phoneNumber: "0900000003",
    nationalId: "0000000003",
    role: UserRole.EMPLOYEE,
    password: "12345678",
    employeeId: 2,
  },
  manager: {
    id: 4,
    email: "manager.user@example.com",
    fullName: "Ymir Fritz",
    phoneNumber: "0900000004",
    nationalId: "0000000004",
    role: UserRole.MANAGER,
    password: "12345678",
    employeeId: 3,
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
  admin: "Store Administrator",
  employee: "Cashier",
  manager: "Store Manager",
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
      },
    });
    await prisma.employee.create({
      data: {
        id: employeeId,
        userId: userData.id,
        jobTitle: employeeProfiles[key],
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
      },
    });
    await prisma.customer.create({
      data: {
        id: customerId,
        userId: userData.id,
        address,
        loyaltyPoints: 150,
        totalSpent: "89.97",
      },
    });
  }
}

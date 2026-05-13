import { UserRole } from "@/prisma";
import { getKeyOf } from "@/utils";
import { prisma } from "./client-instance";
import { HashingService } from "@/hashing/hashing.service";
import { faker } from "@faker-js/faker";
export const usersData = {
  admin: {
    id: 1,
    email: "admin.user@example.com",
    fullName: "Maria Fritz",
    phoneNumber: "0900000001",
    nationalId: "0000000001",
    role: UserRole.ADMIN,
    password: "12345678",
    departmentId: undefined,
  },
  employee: {
    id: 3,
    email: "employee.user@example.com",
    fullName: "Sina Fritz",
    phoneNumber: "0900000003",
    nationalId: "0000000003",
    role: UserRole.EMPLOYEE,
    password: "12345678",
  },
  manager: {
    id: 4,
    email: "manager.user@example.com",
    fullName: "Ymir Fritz",
    phoneNumber: "0900000004",
    nationalId: "0000000004",
    role: UserRole.MANAGER,
    password: "12345678",
  },
};

const customersData = [
  {
    id: 2,
    email: "customer.user@example.com",
    fullName: "Rose Fritz",
    phoneNumber: "0900000002",
    nationalId: "0000000002",
    role: UserRole.CUSTOMER,
    password: "12345678",
    departmentId: undefined,
    address: faker.location.country(),
  },
];

export async function seedUsers(hashingService: HashingService) {
  for (const key of getKeyOf(usersData)) {
    const { password, ...userData } = usersData[key];
    const passwordHash = await hashingService.hash(password);
    await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        isVerified: true,
        isActive: true,
      },
    });
  }

  for (const key of customersData) {
    const { password, address, ...userData } = key;
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
        userId: userData.id,
        address,
      },
    });
  }
}

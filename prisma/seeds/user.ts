import { UserRole as Role } from "@/prisma";
import { getKeyOf } from "@/utils";
import { hashingService, prisma } from "./client-instance";
export const usersData = {
  admin: {
    id: 1,
    email: "admin.user@example.com",
    fullName: "Maria Fritz",
    phoneNumber: "0900000001",
    nationalId: "0000000001",
    role: Role.ADMIN,
    password: "12345678",
    departmentId: undefined,
  },
  customer: {
    id: 2,
    email: "customer.user@example.com",
    fullName: "Rose Fritz",
    phoneNumber: "0900000002",
    nationalId: "0000000002",
    role: Role.CUSTOMER,
    password: "12345678",
    departmentId: undefined,
  },
  employee: {
    id: 3,
    email: "employee.user@example.com",
    fullName: "Sina Fritz",
    phoneNumber: "0900000003",
    nationalId: "0000000003",
    role: Role.EMPLOYEE,
    password: "12345678",
  },
  manager: {
    id: 4,
    email: "manager.user@example.com",
    fullName: "Ymir Fritz",
    phoneNumber: "0900000004",
    nationalId: "0000000004",
    role: Role.MANAGER,
    password: "12345678",
  },
};

export async function seedUsers() {
  for (const key of getKeyOf(usersData)) {
    // console.log("------------------------");

    const { password, ...userData } = usersData[key];
    const passwordHash = await hashingService.hash({
      raw: password,
    });

    await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        isVerified: true,
        isActive: true,
      },
    });
  }
}

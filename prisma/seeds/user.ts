import { Role } from "@/prisma";
import { getKeyOf } from "@/utils";
import { hashingService, prisma } from "./client-instance";
import { data as departmentData } from "./department";
export const usersData = {
  Admin: {
    id: 1,
    email: "admin.user@example.com",
    fullName: "Maria Fritz",
    phoneNumber: "0900000001",
    nationalId: "0000000001",
    role: Role.Admin,
    password: "12345678",
    departmentId: undefined,
  },
  Citizen: {
    id: 2,
    email: "citizen.user@example.com",
    fullName: "Rose Fritz",
    phoneNumber: "0900000002",
    nationalId: "0000000002",
    role: Role.Citizen,
    password: "12345678",
    departmentId: undefined,
  },
  Debugging: {
    id: 3,
    email: "debug.user@example.com",
    fullName: "Ymir Fritz",
    phoneNumber: "0900000003",
    nationalId: "0000000003",
    role: Role.Debugging,
    password: "12345678",
    departmentId: departmentData[0].id,
  },
  Employee: {
    id: 4,
    email: "employee.user@example.com",
    fullName: "Sina Fritz",
    phoneNumber: "0900000004",
    nationalId: "0000000004",
    role: Role.Employee,
    password: "12345678",
    departmentId: departmentData[1].id,
  },
};

export async function seedUsers() {
  for (const key of getKeyOf(usersData)) {
    const userData = usersData[key];
    const password = await hashingService.hash({
      raw: userData.password,
    });
    await prisma.user.create({
      data: {
        ...userData,
        password,
        isVerified: true,
      },
    });
  }
}

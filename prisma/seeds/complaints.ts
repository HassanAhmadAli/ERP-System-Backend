import { usersData as usersData } from "./user";
import { data as departmentsData } from "./department";
import { faker } from "@faker-js/faker";
import { prisma } from "./client-instance";

export const citizenComplaintsData = Array.from({ length: 10 }, (_, index) => {
  const department = departmentsData[index % departmentsData.length]!;
  return {
    id: `000000000000000000000000${index.toString()}`,
    title: faker.lorem.words(4),
    description: faker.lorem.words(26),
    citizenId: usersData.Citizen.id,
    departmentId: department.id,
  };
});

export const debuggingUserComplaintsData = Array.from({ length: 10 }, (_, index) => {
  const department = departmentsData[index % departmentsData.length]!;
  return {
    id: `000000000000000000000001${index.toString()}`,
    title: faker.lorem.words(4),
    description: faker.lorem.words(26),
    citizenId: usersData.Debugging.id,
    departmentId: department.id,
  };
});
export async function seedComplaints() {
  await prisma.complaint.createMany({
    data: [...citizenComplaintsData, ...debuggingUserComplaintsData],
  });
}

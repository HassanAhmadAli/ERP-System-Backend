import { UserRole } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { faker } from "./data/generators";
import { HashingService } from "@/hashing/hashing.service";

interface StaffConfig {
  key: string;
  role: UserRole;
  jobTitle: string;
}

const STAFF_CONFIG: StaffConfig[] = [
  { key: "store.manager", role: UserRole.STORE_MANAGER, jobTitle: "Store Manager" },
  { key: "assistantManager.user", role: UserRole.STORE_MANAGER, jobTitle: "Assistant Store Manager" },
  { key: "cashier.user", role: UserRole.CASHIER, jobTitle: "Senior Cashier" },
  { key: "cashier2.user", role: UserRole.CASHIER, jobTitle: "Cashier" },
  { key: "cashier3.user", role: UserRole.CASHIER, jobTitle: "Cashier" },
  { key: "cashier4.user", role: UserRole.CASHIER, jobTitle: "Junior Cashier" },
  { key: "cashier5.user", role: UserRole.CASHIER, jobTitle: "Cashier" },
  { key: "accountant.user", role: UserRole.ACCOUNTANT, jobTitle: "Senior Accountant" },
  { key: "accountant2.user", role: UserRole.ACCOUNTANT, jobTitle: "Accountant" },
  { key: "warehouse.user", role: UserRole.WAREHOUSE_WORKER, jobTitle: "Warehouse Supervisor" },
  { key: "warehouse2.user", role: UserRole.WAREHOUSE_WORKER, jobTitle: "Warehouse Worker" },
  { key: "warehouse3.user", role: UserRole.WAREHOUSE_WORKER, jobTitle: "Warehouse Worker" },
];

export const STAFF_COUNT = STAFF_CONFIG.length;
const PASSWORD = "12345678";

export async function seedStaff(tx: PrismaTransactionClient, hashingService: HashingService) {
  const passwordHash = await hashingService.hash(PASSWORD);

  for (let i = 0; i < STAFF_CONFIG.length; i++) {
    const config = STAFF_CONFIG[i]!;
    const id = i + 1;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    await tx.user.create({
      data: {
        id,
        email: `${config.key}@example.com`,
        fullName: `${firstName} ${lastName}`,
        phoneNumber: faker.phone.number({ style: "national" }),
        nationalId: String(1_000_000_000 + id),
        passwordHash,
        role: config.role,
        isActive: true,
        isVerified: true,
        language: "en",
        employee: {
          create: {
            id,
            jobTitle: config.jobTitle,
            jobTitleAr: null,
          },
        },
      },
    });
  }
}

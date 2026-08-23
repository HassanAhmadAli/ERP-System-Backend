import { UserRole } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { HashingService } from "@/hashing/hashing.service";

interface StaffMember {
  id: number;
  email: string;
  fullName: string;
  fullNameAr: string;
  phone: string;
  nationalId: string;
  role: UserRole;
  jobTitle: string;
  jobTitleAr: string;
  language: string;
}

export const STAFF_MEMBERS: StaffMember[] = [
  {
    id: 1,
    email: "store.manager@example.com",
    fullName: "Samer Mahmoud Al-Halabi",
    fullNameAr: "سامر محمود الحلبي",
    phone: "+963 944 100 200",
    nationalId: "20350101234",
    role: UserRole.STORE_MANAGER,
    jobTitle: "Store Manager",
    jobTitleAr: "مدير المتجر",
    language: "en",
  },
  {
    id: 2,
    email: "accountant@example.com",
    fullName: "Ghassan Kamal Al-Attar",
    fullNameAr: "غسان كمال العطار",
    phone: "+963 945 234 567",
    nationalId: "20881103030",
    role: UserRole.ACCOUNTANT,
    jobTitle: "Senior Accountant",
    jobTitleAr: "محاسب أول",
    language: "en",
  },
  {
    id: 3,
    email: "cashier.user@example.com",
    fullName: "Youssef Tarek Abdel-Rahman",
    fullNameAr: "يوسف طارق عبد الرحمن",
    phone: "+963 946 345 678",
    nationalId: "20990522150",
    role: UserRole.CASHIER,
    jobTitle: "Cashier",
    jobTitleAr: "أمين صندوق",
    language: "en",
  },
  {
    id: 4,
    email: "cashier2.user@example.com",
    fullName: "Omar Hossam Farouk",
    fullNameAr: "عمر حسام فاروق",
    phone: "+963 947 456 789",
    nationalId: "21010812018",
    role: UserRole.CASHIER,
    jobTitle: "Cashier",
    jobTitleAr: "أمين صندوق",
    language: "ar",
  },
  {
    id: 5,
    email: "warehouse.user@example.com",
    fullName: "Karim Adel Ibrahim",
    fullNameAr: "كريم عادل إبراهيم",
    phone: "+963 948 567 890",
    nationalId: "20921217190",
    role: UserRole.WAREHOUSE_WORKER,
    jobTitle: "Warehouse Supervisor",
    jobTitleAr: "مشرف مستودع",
    language: "ar",
  },
];

export const STAFF_COUNT = STAFF_MEMBERS.length;
export const MANAGER_USER_ID = 1;
export const ACCOUNTANT_USER_ID = 2;
export const ACCOUNTANT_EMPLOYEE_ID = 2;
export const CASHIER_EMPLOYEE_IDS = [3, 4];
export const WAREHOUSE_USER_ID = 5;

const PASSWORD = "12345678";

export async function seedStaff(tx: PrismaTransactionClient, hashingService: HashingService) {
  const passwordHash = await hashingService.hash(PASSWORD);

  const userData = STAFF_MEMBERS.map((s) => ({
    id: s.id,
    email: s.email,
    fullName: s.fullName,
    fullNameAr: s.fullNameAr,
    phoneNumber: s.phone,
    nationalId: s.nationalId,
    passwordHash,
    role: s.role,
    isActive: true,
    isVerified: true,
    language: s.language,
  }));

  await tx.user.createMany({ data: userData });
  await tx.employee.createMany({
    data: STAFF_MEMBERS.map((s) => ({
      id: s.id,
      userId: s.id,
      jobTitle: s.jobTitle,
      jobTitleAr: s.jobTitleAr,
    })),
  });
}

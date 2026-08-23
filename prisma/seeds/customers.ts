import { UserRole, type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { HashingService } from "@/hashing/hashing.service";

interface SeedCustomer {
  id: number;
  email: string;
  fullName: string;
  fullNameAr: string;
  phone: string;
  nationalId: string;
  address: string;
  addressAr: string;
  language: string;
}

const CUSTOMER_SEED_DATA: SeedCustomer[] = [
  {
    id: 6,
    email: "someone@example.com",
    fullName: "Siba Halawa",
    fullNameAr: "صبا حلاوة",
    phone: "+963 933 214 558",
    nationalId: "29603240104",
    address: "12 Bab Touma St, Old Damascus",
    addressAr: "12 شارع باب توما، دمشق القديمة",
    language: "en",
  },
  {
    id: 7,
    email: "hassan.alahmad@outlook.com",
    fullName: "Hassan Mohammad Al-Ahmad",
    fullNameAr: "حسن محمد الأحمد",
    phone: "+963 944 385 762",
    nationalId: "29007170206",
    address: "7 Al-Shalan Main St, Damascus",
    addressAr: "7 الشارع الرئيسي، الشعلان، دمشق",
    language: "ar",
  },
  {
    id: 8,
    email: "nour.qassab@gmail.com",
    fullName: "Nour Al-Huda Qassab",
    fullNameAr: "نور الهدى قصاب",
    phone: "+963 955 476 230",
    nationalId: "29811260107",
    address: "23 Kafarsouseh St, Damascus",
    addressAr: "23 شارع كفرسوسة، دمشق",
    language: "en",
  },
  {
    id: 9,
    email: "khaled.baroudi@yahoo.com",
    fullName: "Khaled Munther Al-Baroudi",
    fullNameAr: "خالد منذر البارودي",
    phone: "+963 962 654 987",
    nationalId: "29504051908",
    address: "5 Rukn Al-Din District, Damascus",
    addressAr: "5 حي ركن الدين، دمشق",
    language: "ar",
  },
  {
    id: 10,
    email: "salma.atassi@gmail.com",
    fullName: "Salma Ashraf Al-Atassi",
    fullNameAr: "سلمى أشرف العطاسي",
    phone: "+963 931 326 789",
    nationalId: "30012251209",
    address: "18 Al-Baramkeh St, Damascus",
    addressAr: "18 شارع البرامكة، دمشق",
    language: "en",
  },
  {
    id: 11,
    email: "amira.sabbagh@outlook.com",
    fullName: "Amira Fathi Al-Sabbagh",
    fullNameAr: "أميرة فتحي الصباغ",
    phone: "+963 936 210 544",
    nationalId: "29309180101",
    address: "40 Al-Qassa Street, Jaramana",
    addressAr: "40 شارع القصة، جرمانا",
    language: "ar",
  },
  {
    id: 12,
    email: "mohammad.khoury@gmail.com",
    fullName: "Mohammad Rida Al-Khoury",
    fullNameAr: "محمد رضا الخوري",
    phone: "+963 959 889 433",
    nationalId: "28706141602",
    address: "9 Qudsaya Main Rd, Rural Damascus",
    addressAr: "9 الطريق الرئيسي، قدسيا، ريف دمشق",
    language: "en",
  },
  {
    id: 13,
    email: "layla.mardini@gmail.com",
    fullName: "Layla Hatem Al-Mardini",
    fullNameAr: "ليلى حاتم المارديني",
    phone: "+963 958 700 812",
    nationalId: "30203301503",
    address: "31 Al-Qazzaz St, Damascus",
    addressAr: "31 شارع القزاز، دمشق",
    language: "ar",
  },
];

export const CUSTOMERS: SeedCustomer[] = CUSTOMER_SEED_DATA;
export const CUSTOMER_COUNT = CUSTOMERS.length;
export const CUSTOMER_ID_OFFSET = CUSTOMERS[0]!.id;

const PASSWORD = "12345678";

export async function seedCustomers(tx: PrismaTransactionClient, hashingService: HashingService) {
  const passwordHash = await hashingService.hash(PASSWORD);

  const userData: Prisma.UserCreateManyInput[] = CUSTOMERS.map((c) => ({
    id: c.id,
    email: c.email,
    fullName: c.fullName,
    fullNameAr: c.fullNameAr,
    phoneNumber: c.phone,
    nationalId: c.nationalId,
    passwordHash,
    role: UserRole.CUSTOMER,
    isActive: true,
    isVerified: true,
    language: c.language,
  }));

  const customerData: Prisma.CustomerCreateManyInput[] = CUSTOMERS.map((c) => ({
    id: c.id,
    userId: c.id,
    address: c.address,
    addressAr: c.addressAr,
    loyaltyPoints: 0,
    totalSpent: "0",
  }));

  await tx.user.createMany({ data: userData });
  await tx.customer.createMany({ data: customerData });
}

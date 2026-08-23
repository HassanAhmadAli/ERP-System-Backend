import type { Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";

interface ExpenseSpec {
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  amount: number;
  daysAgo: number;
  recordedById: number;
}

// Amounts are in Syrian Pounds (SYP) and reflect typical running costs of a
// neighbourhood grocery shop in Damascus.
const EXPENSES: ExpenseSpec[] = [
  {
    description: "Shop rent - monthly installment",
    descriptionAr: "إيجار المحل - القسط الشهري",
    category: "Rent",
    categoryAr: "إيجار",
    amount: 900_000,
    daysAgo: 350,
    recordedById: 1,
  },
  {
    description: "Electricity bill",
    descriptionAr: "فاتورة الكهرباء",
    category: "Utilities",
    categoryAr: "مرافق",
    amount: 180_000,
    daysAgo: 330,
    recordedById: 2,
  },
  {
    description: "Internet and phone lines",
    descriptionAr: "الإنترنت وخطوط الهاتف",
    category: "Utilities",
    categoryAr: "مرافق",
    amount: 95_000,
    daysAgo: 320,
    recordedById: 2,
  },
  {
    description: "Social media advertising campaign",
    descriptionAr: "حملة إعلانية على وسائل التواصل الاجتماعي",
    category: "Marketing",
    categoryAr: "تسويق",
    amount: 250_000,
    daysAgo: 300,
    recordedById: 1,
  },
  {
    description: "Shop rent - monthly installment",
    descriptionAr: "إيجار المحل - القسط الشهري",
    category: "Rent",
    categoryAr: "إيجار",
    amount: 900_000,
    daysAgo: 290,
    recordedById: 1,
  },
  {
    description: "Packaging bags and boxes",
    descriptionAr: "أكياس وصناديق التغليف",
    category: "Operations",
    categoryAr: "تشغيل",
    amount: 140_000,
    daysAgo: 275,
    recordedById: 2,
  },
  {
    description: "POS system annual maintenance",
    descriptionAr: "الصيانة السنوية لنظام نقاط البيع",
    category: "IT",
    categoryAr: "تقنية المعلومات",
    amount: 350_000,
    daysAgo: 260,
    recordedById: 1,
  },
  {
    description: "Refrigerator units repair",
    descriptionAr: "إصلاح وحدات التبريد",
    category: "Maintenance",
    categoryAr: "صيانة",
    amount: 420_000,
    daysAgo: 240,
    recordedById: 2,
  },
  {
    description: "Cleaning supplies and consumables",
    descriptionAr: "مستلزمات ومستهلكات النظافة",
    category: "Operations",
    categoryAr: "تشغيل",
    amount: 85_000,
    daysAgo: 220,
    recordedById: 2,
  },
  {
    description: "Shop rent - monthly installment",
    descriptionAr: "إيجار المحل - القسط الشهري",
    category: "Rent",
    categoryAr: "إيجار",
    amount: 900_000,
    daysAgo: 200,
    recordedById: 1,
  },
  {
    description: "Printed flyers for season opening",
    descriptionAr: "منشورات مطبوعة لافتتاح الموسم",
    category: "Marketing",
    categoryAr: "تسويق",
    amount: 120_000,
    daysAgo: 180,
    recordedById: 1,
  },
  {
    description: "Security cameras subscription",
    descriptionAr: "اشتراك كاميرات المراقبة",
    category: "IT",
    categoryAr: "تقنية المعلومات",
    amount: 90_000,
    daysAgo: 160,
    recordedById: 2,
  },
  {
    description: "Electricity bill",
    descriptionAr: "فاتورة الكهرباء",
    category: "Utilities",
    categoryAr: "مرافق",
    amount: 210_000,
    daysAgo: 140,
    recordedById: 2,
  },
  {
    description: "Shop rent - monthly installment",
    descriptionAr: "إيجار المحل - القسط الشهري",
    category: "Rent",
    categoryAr: "إيجار",
    amount: 900_000,
    daysAgo: 110,
    recordedById: 1,
  },
  {
    description: "Delivery motorbike fuel allowance",
    descriptionAr: "مخصص وقود موتور التوصيل",
    category: "Operations",
    categoryAr: "تشغيل",
    amount: 230_000,
    daysAgo: 90,
    recordedById: 2,
  },
  {
    description: "Shelving and display fixtures",
    descriptionAr: "أرفف وتجهيزات العرض",
    category: "Maintenance",
    categoryAr: "صيانة",
    amount: 650_000,
    daysAgo: 60,
    recordedById: 1,
  },
  {
    description: "Website hosting and domain renewal",
    descriptionAr: "استضافة الموقع وتجديد النطاق",
    category: "IT",
    categoryAr: "تقنية المعلومات",
    amount: 75_000,
    daysAgo: 35,
    recordedById: 2,
  },
  {
    description: "Staff training workshop",
    descriptionAr: "ورشة تدريب للموظفين",
    category: "Operations",
    categoryAr: "تشغيل",
    amount: 150_000,
    daysAgo: 14,
    recordedById: 1,
  },
];

function expenseDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(10, 0, 0, 0);
  return date;
}

export const EXPENSE_COUNT = EXPENSES.length;

export async function seedExpenses(tx: PrismaTransactionClient) {
  const data: Prisma.ExpenseCreateManyInput[] = EXPENSES.map((expense, idx) => ({
    id: idx + 1,
    recordedById: expense.recordedById,
    description: expense.description,
    descriptionAr: expense.descriptionAr,
    category: expense.category,
    categoryAr: expense.categoryAr,
    amount: String(expense.amount),
    expenseDate: expenseDate(expense.daysAgo),
  }));

  await tx.expense.createMany({ data });
}

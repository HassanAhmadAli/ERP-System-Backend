import { type Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { pick, randFloat, randomDate, round } from "./data/generators";

const EXPENSE_COUNT = 80;

const EXPENSE_TEMPLATES = [
  { description: "Monthly electricity bill", category: "Utilities" },
  { description: "Water supply bill", category: "Utilities" },
  { description: "Internet & phone services", category: "Utilities" },
  { description: "Store cleaning supplies", category: "Operations" },
  { description: "Staff lunch & refreshments", category: "Operations" },
  { description: "Security services", category: "Operations" },
  { description: "Packaging materials", category: "Operations" },
  { description: "Printer toner & paper", category: "Office Supplies" },
  { description: "Office stationery", category: "Office Supplies" },
  { description: "Software subscription renewal", category: "IT" },
  { description: "POS system maintenance", category: "IT" },
  { description: "Website hosting", category: "IT" },
  { description: "Social media advertising", category: "Marketing" },
  { description: "Flyer & brochure printing", category: "Marketing" },
  { description: "Promotional banners", category: "Marketing" },
  { description: "Shelf restocking labor", category: "Warehouse" },
  { description: "Warehouse rent", category: "Rent" },
  { description: "Store rent", category: "Rent" },
  { description: "Equipment repair", category: "Maintenance" },
  { description: "HVAC maintenance", category: "Maintenance" },
];

const RECORDING_USER_IDS = [1, 2, 8, 9];

export async function seedExpenses(tx: PrismaTransactionClient) {
  const now = new Date();
  const startDate = new Date(now.getFullYear() - 1, 0, 1);

  const data: Prisma.ExpenseCreateManyInput[] = [];

  for (let i = 0; i < EXPENSE_COUNT; i++) {
    const template = pick(EXPENSE_TEMPLATES);

    data.push({
      id: i + 1,
      recordedById: pick(RECORDING_USER_IDS),
      description: template.description,
      descriptionAr: null,
      category: template.category,
      categoryAr: null,
      amount: round(randFloat(10, 3000, 2)),
      expenseDate: randomDate(startDate, now),
    });
  }

  await tx.expense.createMany({ data });
}

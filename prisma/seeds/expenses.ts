import { prisma } from "./client-instance";

export const expensesData = [
  {
    id: 1,
    recordedById: 1,
    description: "Monthly electricity bill",
    category: "Utilities",
    amount: "320.50",
    expenseDate: new Date("2025-03-31T00:00:00.000Z"),
  },
  {
    id: 2,
    recordedById: 5,
    description: "Store cleaning supplies",
    category: "Operations",
    amount: "85.25",
    expenseDate: new Date("2025-04-05T00:00:00.000Z"),
  },
];

export async function seedExpenses() {
  for (const item of expensesData) {
    await prisma.expense.create({ data: item });
  }
}

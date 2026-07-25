import { ProductImportStatus } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";

export const productImportJobsData = [
  {
    id: 1,
    uploadedById: 5,
    fileName: "spring-inventory.csv",
    status: ProductImportStatus.COMPLETED,
    totalRows: 24,
    successCount: 22,
    errorCount: 2,
    errors: [
      { row: 8, message: "Invalid barcode format" },
      { row: 19, message: "Duplicate SKU" },
    ],
    createdAt: new Date("2025-03-10T09:00:00.000Z"),
    completedAt: new Date("2025-03-10T09:02:30.000Z"),
  },
  {
    id: 2,
    uploadedById: 5,
    fileName: "april-restock.csv",
    status: ProductImportStatus.FAILED,
    totalRows: 10,
    successCount: 0,
    errorCount: 10,
    errors: [{ row: 1, message: "Missing required column: sellingPrice" }],
    createdAt: new Date("2025-04-18T14:00:00.000Z"),
    completedAt: new Date("2025-04-18T14:00:05.000Z"),
  },
];

export async function seedProductImportJobs(tx: PrismaTransactionClient) {
  for (const item of productImportJobsData) {
    await tx.productImportJob.create({ data: item });
  }
}

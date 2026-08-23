import { ProductImportStatus } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { WAREHOUSE_USER_ID } from "./staff";

function daysAgo(days: number, hour = 9, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export const productImportJobsData = [
  {
    id: 1,
    uploadedById: WAREHOUSE_USER_ID,
    fileName: "spring-restock-2026.csv",
    fileNameAr: "توريد-الربيع-2026.csv",
    status: ProductImportStatus.COMPLETED,
    totalRows: 41,
    successCount: 39,
    errorCount: 2,
    errors: [
      { row: 17, message: "Invalid barcode format" },
      { row: 29, message: "Duplicate SKU barcode" },
    ],
    createdAt: daysAgo(45, 9),
    completedAt: daysAgo(45, 9, 2),
  },
  {
    id: 2,
    uploadedById: WAREHOUSE_USER_ID,
    fileName: "snacks-restock.csv",
    fileNameAr: "توريد-السناكس.csv",
    status: ProductImportStatus.FAILED,
    totalRows: 15,
    successCount: 0,
    errorCount: 15,
    errors: [{ row: 1, message: "Missing required column: sellingPrice" }],
    createdAt: daysAgo(12, 14),
    completedAt: daysAgo(12, 14, 1),
  },
];

export async function seedProductImportJobs(tx: PrismaTransactionClient) {
  await tx.productImportJob.createMany({ data: productImportJobsData });
}

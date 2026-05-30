import type { StockoutPrediction } from "@/prisma";

export type PredictionResult = Pick<
  StockoutPrediction,
  "productId" | "currentStock" | "predictedStockoutDate" | "daysUntilStockout"
> & {
  dailyAverageSales: number;
  confidence: number;
};

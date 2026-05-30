export const STOCKOUT_LOOKBACK_DAYS = 30;
export const MIN_SALES_DAYS = 5;
export const STOCKOUT_ALERT_THRESHOLD_DAYS = 7;
export const MIN_CONFIDENCE_FOR_ALERT = 0.7;

export const STOCKOUT_SEVERITIES = {
  low: "low",
  medium: "medium",
  high: "high",
} as const;
export type STOCKOUT_SEVERITIES = ValueOf<typeof STOCKOUT_SEVERITIES>;

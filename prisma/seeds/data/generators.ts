import { DiscountType } from "@/prisma/client";
import type { Prisma } from "@/prisma/client";

export type PrismaTransactionClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
>;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260822);

export function random(): number {
  return rng();
}

export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + rng() * (end.getTime() - start.getTime()));
}

export function weightedRandomIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

export function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((rng() * (max - min) + min).toFixed(decimals));
}

export function round(num: number, decimals = 2): number {
  return parseFloat(num.toFixed(decimals));
}

type DistributionPhase = { range: [number, number]; weight: number };

const ORDER_DISTRIBUTION: DistributionPhase[] = [
  { range: [-12, -10], weight: 0.1 },
  { range: [-9, -7], weight: 0.15 },
  { range: [-6, -4], weight: 0.25 },
  { range: [-3, -1], weight: 0.4 },
  { range: [0, 0], weight: 0.1 },
];

export function randomOrderDate(now: Date): Date {
  const phase = ORDER_DISTRIBUTION[weightedRandomIndex(ORDER_DISTRIBUTION.map((p) => p.weight))]!;
  const [startMonthOffset, endMonthOffset] = phase.range;
  const start = new Date(now.getFullYear(), now.getMonth() + startMonthOffset, 1);
  const end =
    endMonthOffset === 0 ? now : new Date(now.getFullYear(), now.getMonth() + endMonthOffset + 1, 0, 23, 59, 59);

  const date = randomDate(start, end);

  const day = date.getDay();
  const isWeekend = day >= 4;
  if (rng() > (isWeekend ? 0.6 : 0.4)) {
    return randomOrderDate(now);
  }

  date.setHours(randInt(8, 22), randInt(0, 59), randInt(0, 59));
  return date;
}

export interface DiscountRuleLike {
  type: DiscountType;
  value: number;
  maxInvoiceValue: number;
}

export function computeDiscountAmount(rule: DiscountRuleLike, subtotal: number): number {
  const raw = rule.type === DiscountType.PERCENTAGE ? (subtotal * rule.value) / 100 : Math.min(rule.value, subtotal);
  const capped = rule.maxInvoiceValue > 0 ? Math.min(raw, rule.maxInvoiceValue) : raw;
  return round(Math.min(capped, subtotal));
}

import { AdPlacement } from "@/prisma/client";
import { prisma } from "./client-instance";

export const adsData = [
  {
    id: 1,
    title: "Summer Sale",
    description: "Up to 30% off selected electronics and accessories.",
    imageUrl: "https://cdn.example.com/ads/summer-sale-banner.jpg",
    linkUrl: "https://example.com/promotions/summer-sale",
    placement: AdPlacement.HOME,
    isActive: true,
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    endDate: new Date("2026-12-31T23:59:59.000Z"),
  },
  {
    id: 2,
    title: "Free shipping on orders over $50",
    description: "Checkout today and get free delivery on qualifying orders.",
    imageUrl: null,
    linkUrl: "https://example.com/promotions/free-shipping",
    placement: AdPlacement.CHECKOUT,
    isActive: true,
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    endDate: null,
  },
  {
    id: 3,
    title: "New arrivals this week",
    description: "Browse the latest products added to our catalog.",
    imageUrl: "https://cdn.example.com/ads/new-arrivals-sidebar.jpg",
    linkUrl: "https://example.com/products?sort=newest",
    placement: AdPlacement.SIDEBAR,
    isActive: true,
    startDate: new Date("2025-04-01T00:00:00.000Z"),
    endDate: new Date("2026-06-30T23:59:59.000Z"),
  },
  {
    id: 4,
    title: "Loyalty members earn double points",
    description: "Limited-time offer for registered customers.",
    imageUrl: null,
    linkUrl: "https://example.com/loyalty",
    placement: AdPlacement.HOME,
    isActive: false,
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    endDate: new Date("2024-12-31T23:59:59.000Z"),
  },
];

export async function seedAds() {
  for (const item of adsData) {
    await prisma.advertisement.create({ data: item });
  }
}

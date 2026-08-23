import { AdPlacement } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export const adsData = [
  {
    id: 1,
    title: "Fresh Produce Week",
    titleAr: "أسبوع الخضار والفواكه الطازجة",
    description: "Daily arrivals from the Ghouta farms with special prices.",
    descriptionAr: "وصولات يومية من مزارع الغوطة بأسعار مميزة.",
    imageUrl: null,
    linkUrl: "/products?category=vegetables",
    placement: AdPlacement.HOME,
    isActive: true,
    startDate: daysFromNow(-10),
    endDate: daysFromNow(20),
  },
  {
    id: 2,
    title: "Free delivery on orders over SYP 150,000",
    titleAr: "توصيل مجاني للطلبات التي تتجاوز 150,000 ليرة سورية",
    description: "Shop online and get your order delivered anywhere at no extra cost.",
    descriptionAr: "تسوق عبر الإنترنت واحصل على توصيل طلبك دون أي رسوم إضافية.",
    imageUrl: null,
    linkUrl: "/products",
    placement: AdPlacement.CHECKOUT,
    isActive: true,
    startDate: daysFromNow(-30),
    endDate: null,
  },
  {
    id: 3,
    title: "Earn points with every purchase",
    titleAr: "اجمع النقاط مع كل عملية شراء",
    description: "Join the loyalty program and redeem points for exclusive rewards.",
    descriptionAr: "انضم إلى برنامج الولاء واستبدل نقاطك بمكافآت حصرية.",
    imageUrl: null,
    linkUrl: "/loyalty",
    placement: AdPlacement.SIDEBAR,
    isActive: true,
    startDate: daysFromNow(-60),
    endDate: daysFromNow(90),
  },
  {
    id: 4,
    title: "Ramadan Kareem offers",
    titleAr: "عروض رمضان كريم",
    description: "Special discounts across the store during the holy month.",
    descriptionAr: "خصومات خاصة على جميع أقسام المتجر خلال الشهر الكريم.",
    imageUrl: null,
    linkUrl: "/products?promo=ramadan",
    placement: AdPlacement.HOME,
    isActive: false,
    startDate: daysFromNow(-200),
    endDate: daysFromNow(-170),
  },
];

export async function seedAds(tx: PrismaTransactionClient) {
  await tx.advertisement.createMany({ data: adsData });
}

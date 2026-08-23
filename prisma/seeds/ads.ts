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
    imageUrl:
      "https://st.focusedcollection.com/14144030/i/650/focused_179970070-stock-photo-fresh-produce-supermarket-person-background.jpg",
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
    imageUrl: "https://img.magnific.com/free-vector/fast-free-delivery-logo-with-bike-man-courier_1308-49146.jpg",
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
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0717/8934/7128/files/ChatGPT_Image_May_26_2025_03_18_45_PM.png?v=1748269166",
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
    imageUrl:
      "https://cdn.shopify.com/app-store/listing_images/d32077cf0fc3323743aaafd1d429b52a/icon/CIaJ3fqL95EDEAE=.png",
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

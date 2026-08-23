import type { Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";

export interface SeedSupplier {
  id: number;
  fullName: string;
  fullNameAr: string;
  phone: string;
  email: string;
  address: string;
  addressAr: string;
}

export const SUPPLIERS: SeedSupplier[] = [
  {
    id: 1,
    fullName: "Al-Furat Food Distribution",
    fullNameAr: "الفرات للتوزيع الغذائي",
    phone: "+963 11 231 4455",
    email: "sales@alfurat-foods.sy",
    address: "Shalaan District, Al-Quds St, Damascus",
    addressAr: "حي الشعلان، شارع القدس، دمشق",
  },
  {
    id: 2,
    fullName: "Al-Baraka Dairy & Cheese",
    fullNameAr: "البركة للألبان والأجبان",
    phone: "+963 13 722 6688",
    email: "orders@albaraka-dairy.sy",
    address: "Douma Industrial Zone, Rural Damascus",
    addressAr: "المنطقة الصناعية، دوما، ريف دمشق",
  },
  {
    id: 3,
    fullName: "Aleppo House of Grains",
    fullNameAr: "بيت الحبوب الحلبي",
    phone: "+963 21 264 7788",
    email: "wholesale@aleppograins.sy",
    address: "Salah Al-Din District, Aleppo",
    addressAr: "حي صلاح الدين، حلب",
  },
  {
    id: 4,
    fullName: "Al-Massa Meat & Poultry",
    fullNameAr: "الماسة للحوم والدواجن",
    phone: "+963 31 512 9900",
    email: "info@almassa-meats.sy",
    address: "Al-Waar District, Homs",
    addressAr: "حي الوعر، حمص",
  },
  {
    id: 5,
    fullName: "Thamarat Al-Sahel Fruits",
    fullNameAr: "ثمرات الساحل للفواكه",
    phone: "+963 41 376 2233",
    email: "export@thamarat-sahel.sy",
    address: "Corniche Road, Latakia",
    addressAr: "طريق الكورنيش، اللاذقية",
  },
  {
    id: 6,
    fullName: "Cham Snacks & Beverages",
    fullNameAr: "شام للسناكس والمشروبات",
    phone: "+963 11 455 8811",
    email: "sales@chamsnacks.sy",
    address: "Al-Mazzeh Autostrade, Damascus",
    addressAr: "أوتوستراد المزة، دمشق",
  },
  {
    id: 7,
    fullName: "Al-Nour Cleaning Supplies",
    fullNameAr: "النور لمستلزمات التنظيف",
    phone: "+963 11 618 3377",
    email: "contact@alnour-clean.sy",
    address: "Qaboun Industrial Area, Damascus",
    addressAr: "المنطقة الصناعية، قابون، دمشق",
  },
  {
    id: 8,
    fullName: "Green Ghouta Farms",
    fullNameAr: "مزارع الغوطة الخضراء",
    phone: "+963 15 833 4422",
    email: "fresh@ghoutafarms.sy",
    address: "Saqba Central Market, Rural Damascus",
    addressAr: "سوق صقبا المركزي، ريف دمشق",
  },
];

export const SUPPLIER_COUNT = SUPPLIERS.length;

export async function seedSuppliers(tx: PrismaTransactionClient) {
  const data: Prisma.SupplierCreateManyInput[] = SUPPLIERS.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    fullNameAr: s.fullNameAr,
    phone: s.phone,
    email: s.email,
    address: s.address,
    addressAr: s.addressAr,
  }));

  await tx.supplier.createMany({ data });
}

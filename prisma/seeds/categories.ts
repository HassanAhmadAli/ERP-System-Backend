import type { Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";

export interface SeedCategory {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
}

export const CATEGORIES: SeedCategory[] = [
  {
    id: 1,
    name: "Vegetables",
    nameAr: "خضار",
    description: "Fresh daily vegetables from the Damascus countryside farms.",
    descriptionAr: "خضار طازجة يومية من مزارع ريف دمشق.",
  },
  {
    id: 2,
    name: "Fruits",
    nameAr: "فواكه",
    description: "Seasonal local and imported fruits, picked fresh.",
    descriptionAr: "فواكه موسمية محلية ومستوردة طازجة.",
  },
  {
    id: 3,
    name: "Dairy & Eggs",
    nameAr: "ألبان وبيض",
    description: "Fresh milk, white cheese, yogurt, ghee and farm eggs.",
    descriptionAr: "حليب طازج وجبنة بيضاء ولبن رايب وسمنة وبيض بلدي.",
  },
  {
    id: 4,
    name: "Meat & Poultry",
    nameAr: "لحوم ودواجن",
    description: "Refrigerated chicken, veal and local lamb meat.",
    descriptionAr: "دجاج مبرد ولحم عجل ولحم غنم بلدي.",
  },
  {
    id: 5,
    name: "Grains & Legumes",
    nameAr: "حبوب وبقوليات",
    description: "Rice, bulgur, frikeh, lentils, chickpeas and pasta.",
    descriptionAr: "أرز وبرغل وفريكة وعدس وحمص ومعكرونة.",
  },
  {
    id: 6,
    name: "Pantry & Oil",
    nameAr: "زيوت ومونة",
    description: "Olive oil, sugar, tea, coffee, salt, tomato paste and thyme.",
    descriptionAr: "زيت زيتون وسكر وشاي وقهوة وملح ومعجون بندورة وزعتر.",
  },
  {
    id: 7,
    name: "Beverages & Snacks",
    nameAr: "مشروبات وسناكس",
    description: "Soft drinks, juices, biscuits, chocolate, chips and halva.",
    descriptionAr: "مشروبات غازية وعصائر وبسكويت وشوكولاتة وشيبس وحلاوة.",
  },
  {
    id: 8,
    name: "Cleaning & Household",
    nameAr: "منظفات ومستلزمات منزلية",
    description: "Laundry detergent, dish soap, bleach and paper supplies.",
    descriptionAr: "مساحيق غسيل وصابون أطباق وكلور ومناديل ورقية.",
  },
];

export const CATEGORY_COUNT = CATEGORIES.length;

export async function seedCategories(tx: PrismaTransactionClient) {
  const data: Prisma.CategoryCreateManyInput[] = CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    description: c.description,
    descriptionAr: c.descriptionAr,
    imageUrl: null,
    storedFileId: null,
  }));

  await tx.category.createMany({ data });
}

import type { Prisma } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";

export const CATEGORY_NAMES = [
  "Smartphones",
  "Laptops",
  "Tablets",
  "Headphones & Audio",
  "Cameras & Camcorders",
  "Smartwatches",
  "Computer Accessories",
  "TVs & Monitors",
  "Gaming Consoles",
  "Networking Equipment",
  "Men's T-Shirts",
  "Men's Shoes",
  "Women's Dresses",
  "Women's Shoes",
  "Kids' Clothing",
  "Baby Products",
  "Fresh Fruits",
  "Fresh Vegetables",
  "Dairy & Eggs",
  "Bakery & Bread",
  "Beverages",
  "Snacks & Chips",
  "Canned & Jarred Foods",
  "Frozen Foods",
  "Cooking Oil & Ghee",
  "Spices & Seasonings",
  "Rice & Grains",
  "Pasta & Noodles",
  "Sauces & Condiments",
  "Coffee & Tea",
  "Soft Drinks",
  "Juices & Smoothies",
  "Water & Mineral Water",
  "Energy Drinks",
  "Pet Food",
  "Pet Supplies",
  "Cleaning Supplies",
  "Laundry & Detergents",
  "Paper & Disposable Products",
  "Kitchen Appliances",
  "Cookware & Bakeware",
  "Home Decor",
  "Bedding & Linens",
  "Bathroom Accessories",
  "Tools & Hardware",
  "Electrical Supplies",
  "Paint & Coatings",
  "Office Supplies",
  "Books",
  "Stationery & Cards",
  "School Supplies",
  "Vitamins & Supplements",
  "First Aid & Medical",
  "Personal Care",
  "Cosmetics",
  "Fragrances & Deodorants",
  "Hair Care",
  "Skin Care",
  "Sports & Fitness Equipment",
  "Camping & Outdoor Gear",
  "Toys & Games",
  "Video Games",
  "Party Supplies",
  "Automotive Accessories",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];
export const CATEGORY_COUNT = CATEGORY_NAMES.length; // 64

export function seedCategories(tx: PrismaTransactionClient) {
  const data: Prisma.CategoryCreateManyInput[] = CATEGORY_NAMES.map((name, idx) => ({
    id: idx + 1,
    name,
    nameAr: null,
    description: `${name} — ${getCategoryDescription(name)}`,
    descriptionAr: null,
    imageUrl: null,
    storedFileId: null,
  }));

  return tx.category.createMany({ data });
}

function getCategoryDescription(name: string): string {
  const descriptions: Record<string, string> = {
    Smartphones: "Latest mobile phones and accessories",
    Laptops: "Notebooks, ultrabooks, and gaming laptops",
    Headphones: "Wireless and wired audio devices",
  };
  return descriptions[name] ?? `High-quality ${name.toLowerCase()} for everyday needs`;
}

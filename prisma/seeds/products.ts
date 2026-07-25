import type { Prisma } from "@/prisma/client";
import { faker, nextBarcode, randFloat, randInt, pick } from "./data/generators";
import { CATEGORY_NAMES, type CategoryName } from "./categories";
import { SUPPLIER_COUNT } from "./suppliers";

const PRODUCTS_PER_CATEGORY: Record<string, number> = {
  Smartphones: 12,
  Laptops: 10,
  Tablets: 8,
  "Headphones & Audio": 12,
  "Cameras & Camcorders": 8,
  Smartwatches: 8,
  "Computer Accessories": 15,
  "TVs & Monitors": 10,
  "Gaming Consoles": 6,
  "Networking Equipment": 8,
  "Men's T-Shirts": 12,
  "Men's Shoes": 10,
  "Women's Dresses": 12,
  "Women's Shoes": 10,
  "Kids' Clothing": 12,
  "Baby Products": 8,
  "Fresh Fruits": 10,
  "Fresh Vegetables": 10,
  "Dairy & Eggs": 8,
  "Bakery & Bread": 8,
  Beverages: 8,
  "Snacks & Chips": 10,
  "Canned & Jarred Foods": 8,
  "Frozen Foods": 8,
  "Cooking Oil & Ghee": 6,
  "Spices & Seasonings": 10,
  "Rice & Grains": 6,
  "Pasta & Noodles": 6,
  "Sauces & Condiments": 8,
  "Coffee & Tea": 10,
  "Soft Drinks": 8,
  "Juices & Smoothies": 6,
  "Water & Mineral Water": 4,
  "Energy Drinks": 6,
  "Pet Food": 8,
  "Pet Supplies": 8,
  "Cleaning Supplies": 8,
  "Laundry & Detergents": 6,
  "Paper & Disposable Products": 6,
  "Kitchen Appliances": 10,
  "Cookware & Bakeware": 8,
  "Home Decor": 10,
  "Bedding & Linens": 8,
  "Bathroom Accessories": 6,
  "Tools & Hardware": 10,
  "Electrical Supplies": 8,
  "Paint & Coatings": 6,
  "Office Supplies": 10,
  Books: 10,
  "Stationery & Cards": 6,
  "School Supplies": 8,
  "Vitamins & Supplements": 8,
  "First Aid & Medical": 6,
  "Personal Care": 10,
  Cosmetics: 10,
  "Fragrances & Deodorants": 8,
  "Hair Care": 8,
  "Skin Care": 10,
  "Sports & Fitness Equipment": 10,
  "Camping & Outdoor Gear": 8,
  "Toys & Games": 10,
  "Video Games": 8,
  "Party Supplies": 6,
  "Automotive Accessories": 8,
};

const ELECTRONICS_CATEGORIES = new Set([
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
]);

const GROCERY_CATEGORIES = new Set([
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
]);

function generateProductName(category: CategoryName): string {
  if (ELECTRONICS_CATEGORIES.has(category)) {
    const brand = faker.company.name();
    const model = `${faker.string.alpha({ length: 2, casing: "upper" })}-${faker.number.int({ min: 100, max: 9999 })}`;
    return `${brand} ${model}`;
  }
  if (GROCERY_CATEGORIES.has(category)) {
    const adjectives = ["Organic", "Premium", "Fresh", "Natural", "Imported", "Local", "Pure"];
    return `${pick(adjectives)} ${faker.commerce.productAdjective()} ${category.slice(0, -1)}`;
  }
  const adj = faker.commerce.productAdjective();
  const material = faker.commerce.productMaterial();
  return `${adj} ${material} ${faker.commerce.product()}`;
}

function generatePriceRange(category: CategoryName): { purchasePrice: number; sellingPrice: number } {
  if (ELECTRONICS_CATEGORIES.has(category)) {
    const purchasePrice = randFloat(5, 500);
    const markup = randFloat(1.15, 1.8);
    return { purchasePrice, sellingPrice: round(purchasePrice * markup) };
  }
  if (GROCERY_CATEGORIES.has(category)) {
    const purchasePrice = randFloat(0.5, 15);
    const markup = randFloat(1.2, 2.0);
    return { purchasePrice, sellingPrice: round(purchasePrice * markup) };
  }
  const purchasePrice = randFloat(1, 100);
  const markup = randFloat(1.2, 2.2);
  return { purchasePrice, sellingPrice: round(purchasePrice * markup) };
}

let productId = 0;
export function generateProductData(): Prisma.ProductCreateManyInput[] {
  const products: Prisma.ProductCreateManyInput[] = [];

  for (const categoryName of CATEGORY_NAMES) {
    const count = PRODUCTS_PER_CATEGORY[categoryName] ?? 8;
    for (let i = 0; i < count; i++) {
      productId++;
      const { purchasePrice, sellingPrice } = generatePriceRange(categoryName);
      const categoryIndex = CATEGORY_NAMES.indexOf(categoryName);
      products.push({
        id: productId,
        name: generateProductName(categoryName),
        nameAr: null,
        description: faker.commerce.productDescription(),
        descriptionAr: null,
        barcode: nextBarcode(),
        purchasePrice,
        sellingPrice,
        quantityInStock: randInt(10, 500),
        minQuantity: randInt(5, 30),
        categoryId: categoryIndex + 1,
        supplierId: randInt(1, SUPPLIER_COUNT),
        imageUrl: faker.image.url({}),
      });
    }
  }

  return products;
}

function round(num: number, decimals = 2): number {
  return parseFloat(num.toFixed(decimals));
}

export const PRODUCT_COUNT = CATEGORY_NAMES.reduce((sum, cat) => sum + (PRODUCTS_PER_CATEGORY[cat] ?? 8), 0);

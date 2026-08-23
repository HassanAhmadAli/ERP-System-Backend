import { random } from "./generators";

export interface CatalogProduct {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  minQuantity: number;
  categoryId: number;
  supplierId: number;
}

// Retail prices are in Syrian Pounds (SYP) and reflect typical Damascus market levels.
const RAW_PRODUCTS: Omit<CatalogProduct, "id" | "barcode">[] = [
  // ---- Vegetables (category 1, supplier 8) ----
  {
    name: "Local Tomato (per kg)",
    nameAr: "بندورة بلدي (كيلو)",
    description: "Fresh ripe local tomatoes, ideal for salads and cooking.",
    descriptionAr: "بندورة بلدي طازجة ناضجة، مثالية للسلطات والطبخ.",
    purchasePrice: 5500,
    sellingPrice: 7500,
    minQuantity: 20,
    categoryId: 1,
    supplierId: 8,
  },
  {
    name: "Cucumber (per kg)",
    nameAr: "خيار بلدي (كيلو)",
    description: "Crisp small cucumbers, freshly picked every morning.",
    descriptionAr: "خيار صغير مقرمش يُقطف طازجًا كل صباح.",
    purchasePrice: 5000,
    sellingPrice: 7000,
    minQuantity: 18,
    categoryId: 1,
    supplierId: 8,
  },
  {
    name: "Potato (per kg)",
    nameAr: "بطاطا (كيلو)",
    description: "Firm all-purpose potatoes, washed and graded.",
    descriptionAr: "بطاطا صلبة متعددة الاستخدامات، مغسولة ومفرزة.",
    purchasePrice: 3500,
    sellingPrice: 5000,
    minQuantity: 30,
    categoryId: 1,
    supplierId: 8,
  },
  {
    name: "Yellow Onion (per kg)",
    nameAr: "بصل أصفر (كيلو)",
    description: "Golden dry onions with strong flavour, long shelf life.",
    descriptionAr: "بصل جاف ذهبي بنكهة قوية وعمر تخزين طويل.",
    purchasePrice: 3000,
    sellingPrice: 4500,
    minQuantity: 30,
    categoryId: 1,
    supplierId: 8,
  },

  // ---- Fruits (category 2, supplier 5) ----
  {
    name: "Banana (per kg)",
    nameAr: "موز (كيلو)",
    description: "Sweet imported bananas, ripened on arrival.",
    descriptionAr: "موز مستورد حلو المذاق يُنضج عند الوصول.",
    purchasePrice: 11000,
    sellingPrice: 15000,
    minQuantity: 13,
    categoryId: 2,
    supplierId: 5,
  },
  {
    name: "Local Apple (per kg)",
    nameAr: "تفاح محلي (كيلو)",
    description: "Crisp apples from Damascus countryside orchards.",
    descriptionAr: "تفاح مقرمش من بساتين ريف دمشق.",
    purchasePrice: 9000,
    sellingPrice: 13000,
    minQuantity: 15,
    categoryId: 2,
    supplierId: 5,
  },
  {
    name: "Orange (per kg)",
    nameAr: "برتقال أبو سرة (كيلو)",
    description: "Juicy winter oranges, perfect for fresh juice.",
    descriptionAr: "برتقال شتوي عصيري مثالي لعصير طازج.",
    purchasePrice: 5000,
    sellingPrice: 7500,
    minQuantity: 20,
    categoryId: 2,
    supplierId: 5,
  },
  {
    name: "Lemon (per kg)",
    nameAr: "ليمون حامض (كيلو)",
    description: "Thin-skinned sour lemons with strong aroma.",
    descriptionAr: "ليمون حامض رقيق القشرة بقوة رائحة عالية.",
    purchasePrice: 7000,
    sellingPrice: 10000,
    minQuantity: 13,
    categoryId: 2,
    supplierId: 5,
  },

  // ---- Dairy & Eggs (category 3, supplier 2) ----
  {
    name: "Fresh Cow Milk 1L",
    nameAr: "حليب بقري طازج 1 لتر",
    description: "Pasteurised full-fat cow milk, delivered daily.",
    descriptionAr: "حليب بقري كامل الدسم مبستر يوصَل يوميًا.",
    purchasePrice: 8000,
    sellingPrice: 11000,
    minQuantity: 15,
    categoryId: 3,
    supplierId: 2,
  },
  {
    name: "White Cheese (per kg)",
    nameAr: "جبنة بيضاء (كيلو)",
    description: "Traditional brined white cheese from rural dairies.",
    descriptionAr: "جبنة بيضاء مملحة تقليدية من مصانع الريف.",
    purchasePrice: 42000,
    sellingPrice: 55000,
    minQuantity: 8,
    categoryId: 3,
    supplierId: 2,
  },
  {
    name: "Akkawi Cheese (per kg)",
    nameAr: "جبنة عكاوي (كيلو)",
    description: "Semi-hard salty cheese loved for breakfast tables.",
    descriptionAr: "جبنة شبه صلبة مالحة أساسية على موائد الفطور.",
    purchasePrice: 52000,
    sellingPrice: 68000,
    minQuantity: 6,
    categoryId: 3,
    supplierId: 2,
  },
  {
    name: "Yogurt (per kg)",
    nameAr: "لبن رايب (كيلو)",
    description: "Thick creamy cow-milk yogurt, made fresh daily.",
    descriptionAr: "لبن رايب سميك كريمي من حليب البقر يُصنع يوميًا.",
    purchasePrice: 11000,
    sellingPrice: 15000,
    minQuantity: 15,
    categoryId: 3,
    supplierId: 2,
  },
  {
    name: "Farm Eggs Tray (30 eggs)",
    nameAr: "طبق بيض بلدي (30 بيضة)",
    description: "Large brown eggs from free-range village farms.",
    descriptionAr: "بيض بني كبير من مزارع قروية حرة التربية.",
    purchasePrice: 70000,
    sellingPrice: 90000,
    minQuantity: 10,
    categoryId: 3,
    supplierId: 2,
  },
  {
    name: "Village Ghee (per kg)",
    nameAr: "سمنة غنم بلدية (كيلو)",
    description: "Pure sheep ghee slow-cooked the traditional way.",
    descriptionAr: "سمنة غنم صافية مطبوخة على الطريقة التقليدية.",
    purchasePrice: 110000,
    sellingPrice: 145000,
    minQuantity: 4,
    categoryId: 3,
    supplierId: 2,
  },

  // ---- Meat & Poultry (category 4, supplier 4) ----
  {
    name: "Whole Chilled Chicken (~1.5kg)",
    nameAr: "دجاج كامل مبرد (1.5 كغ تقريبًا)",
    description: "Fresh chilled whole chicken, cleaned and ready to cook.",
    descriptionAr: "دجاج كامل طازج مبرد، منظّف وجاهز للطبخ.",
    purchasePrice: 52000,
    sellingPrice: 68000,
    minQuantity: 10,
    categoryId: 4,
    supplierId: 4,
  },
  {
    name: "Minced Veal (per kg)",
    nameAr: "لحم عجل مفروم (كيلو)",
    description: "Lean minced veal, ground fresh every morning.",
    descriptionAr: "لحم عجل قليل الدهن يُفرم طازجًا كل صباح.",
    purchasePrice: 170000,
    sellingPrice: 220000,
    minQuantity: 5,
    categoryId: 4,
    supplierId: 4,
  },
  {
    name: "Local Lamb Meat (per kg)",
    nameAr: "لحم غنم بلدي (كيلو)",
    description: "Premium local lamb, tender and full-flavoured.",
    descriptionAr: "لحم غنم بلدي فاخر طري غني بالنكهة.",
    purchasePrice: 240000,
    sellingPrice: 310000,
    minQuantity: 4,
    categoryId: 4,
    supplierId: 4,
  },
  {
    name: "Chicken Breast Fillet (per kg)",
    nameAr: "فيليه صدور دجاج (كيلو)",
    description: "Skinless boneless chicken breast fillets.",
    descriptionAr: "شرحات صدور دجاج منزوعة الجلد والعظم.",
    purchasePrice: 78000,
    sellingPrice: 100000,
    minQuantity: 6,
    categoryId: 4,
    supplierId: 4,
  },

  // ---- Grains & Legumes (category 5, supplier 3) ----
  {
    name: "Egyptian Rice (per kg)",
    nameAr: "أرز مصري فاخر (كيلو)",
    description: "Short-grain Egyptian rice, rich and aromatic.",
    descriptionAr: "أرز مصري قصير الحبة غني بالطعم والرائحة.",
    purchasePrice: 13000,
    sellingPrice: 17000,
    minQuantity: 20,
    categoryId: 5,
    supplierId: 3,
  },
  {
    name: "Coarse Bulgur (per kg)",
    nameAr: "برغل خشن (كيلو)",
    description: "Stone-ground coarse bulgur for pilaf and kibbeh.",
    descriptionAr: "برغل خشن مطحون حجرية للمقلوبة والكبة.",
    purchasePrice: 6500,
    sellingPrice: 9000,
    minQuantity: 18,
    categoryId: 5,
    supplierId: 3,
  },
  {
    name: "Red Lentils (per kg)",
    nameAr: "عدس أحمر (كيلو)",
    description: "Clean split red lentils, quick to cook.",
    descriptionAr: "عدس أحمر مقشور نظيف وسريع الطهي.",
    purchasePrice: 11000,
    sellingPrice: 14500,
    minQuantity: 15,
    categoryId: 5,
    supplierId: 3,
  },
  {
    name: "Chickpeas (per kg)",
    nameAr: "حمص شامي (كيلو)",
    description: "Large uniform chickpeas for hummus and stews.",
    descriptionAr: "حمص شامي كبير ومتساوٍ للحمص والمطبوخات.",
    purchasePrice: 12000,
    sellingPrice: 16000,
    minQuantity: 15,
    categoryId: 5,
    supplierId: 3,
  },
  {
    name: "Green Frikeh (per kg)",
    nameAr: "فريكة خضراء (كيلو)",
    description: "Smoked young green wheat harvested in spring.",
    descriptionAr: "فريكة خضراء مدخّنة تُحصد في الربيع.",
    purchasePrice: 14000,
    sellingPrice: 18500,
    minQuantity: 10,
    categoryId: 5,
    supplierId: 3,
  },
  {
    name: "Spaghetti Pasta 400g",
    nameAr: "معكرونة إسباغيتي 400 غرام",
    description: "Durum wheat spaghetti that holds its bite.",
    descriptionAr: "معكرونة إسباغيتي من قمح القاسي تحافظ على قوامها.",
    purchasePrice: 3500,
    sellingPrice: 5000,
    minQuantity: 25,
    categoryId: 5,
    supplierId: 3,
  },

  // ---- Pantry & Oil (category 6, supplier 1) ----
  {
    name: "Sunflower Oil 1L",
    nameAr: "زيت دوار الشمس 1 لتر",
    description: "Refined sunflower oil for frying and baking.",
    descriptionAr: "زيت دوار شمس مكرر للقلي والحلويات.",
    purchasePrice: 26000,
    sellingPrice: 34000,
    minQuantity: 13,
    categoryId: 6,
    supplierId: 1,
  },
  {
    name: "Extra-Virgin Olive Oil 1L",
    nameAr: "زيت زيتون بكر ممتاز 1 لتر",
    description: "Cold-pressed olive oil from Idlib groves, first press.",
    descriptionAr: "زيت زيتون معصور على البارد من بساتين إدلب، عصرة أولى.",
    purchasePrice: 130000,
    sellingPrice: 175000,
    minQuantity: 5,
    categoryId: 6,
    supplierId: 1,
  },
  {
    name: "Fine Sugar (per kg)",
    nameAr: "سكر ناعم (كيلو)",
    description: "Refined fine-white sugar for drinks and desserts.",
    descriptionAr: "سكر أبيض ناعم مكرر للمشروبات والحلويات.",
    purchasePrice: 7000,
    sellingPrice: 9500,
    minQuantity: 30,
    categoryId: 6,
    supplierId: 1,
  },
  {
    name: "Black Tea 450g",
    nameAr: "شاي أحمر 450 غرام",
    description: "Strong loose-leaf black tea, the base of every gathering.",
    descriptionAr: "شاي أحمر ورقية قوي، أساس كل مجلس.",
    purchasePrice: 32000,
    sellingPrice: 42000,
    minQuantity: 10,
    categoryId: 6,
    supplierId: 1,
  },
  {
    name: "Ground Turkish Coffee 200g",
    nameAr: "قهوة تركية مطحونة 200 غرام",
    description: "Fine-ground roasted coffee with cardamom aroma.",
    descriptionAr: "قهوة محمصة مطحونة ناعمة برائحة الهيل.",
    purchasePrice: 42000,
    sellingPrice: 55000,
    minQuantity: 8,
    categoryId: 6,
    supplierId: 1,
  },
  {
    name: "Sea Salt (per kg)",
    nameAr: "ملح بحري (كيلو)",
    description: "Natural sea salt, coarse ground.",
    descriptionAr: "ملح بحري طبيعي مطحون خشن.",
    purchasePrice: 1200,
    sellingPrice: 2000,
    minQuantity: 25,
    categoryId: 6,
    supplierId: 1,
  },
  {
    name: "Tomato Paste 830g",
    nameAr: "معجون بندورة 830 غرام",
    description: "Double-concentrated tomato paste in a tin can.",
    descriptionAr: "معجون بندورة مركز مضاعف في علبة معدنية.",
    purchasePrice: 17000,
    sellingPrice: 23000,
    minQuantity: 15,
    categoryId: 6,
    supplierId: 1,
  },
  {
    name: "Damascene Thyme Mix 500g",
    nameAr: "زعتر دمشقي 500 غرام",
    description: "Classic thyme blend with sumac, sesame and olive oil.",
    descriptionAr: "خلطة زعتر كلاسيكية مع سماق وسمسم وزيت زيتون.",
    purchasePrice: 19000,
    sellingPrice: 26000,
    minQuantity: 10,
    categoryId: 6,
    supplierId: 1,
  },

  // ---- Beverages & Snacks (category 7, supplier 6) ----
  {
    name: "Cola Soft Drink 1.5L",
    nameAr: "مشروب غازي كولا 1.5 لتر",
    description: "Chilled fizzy cola, family size bottle.",
    descriptionAr: "مشروب غازي مثلج بالقنينة العائلية.",
    purchasePrice: 8000,
    sellingPrice: 11000,
    minQuantity: 20,
    categoryId: 7,
    supplierId: 6,
  },
  {
    name: "Orange Juice 1L",
    nameAr: "عصير برتقال 1 لتر",
    description: "Juice made from pressed oranges, no added sugar.",
    descriptionAr: "عصير من البرتقال الطبيعي دون سكر مضاف.",
    purchasePrice: 11000,
    sellingPrice: 15000,
    minQuantity: 13,
    categoryId: 7,
    supplierId: 6,
  },
  {
    name: "Mineral Water 1.5L",
    nameAr: "مية معدنية 1.5 لتر",
    description: "Natural mineral water from mountain springs.",
    descriptionAr: "مية معدنية طبيعية من ينابيع جبلية.",
    purchasePrice: 1500,
    sellingPrice: 2500,
    minQuantity: 40,
    categoryId: 7,
    supplierId: 6,
  },
  {
    name: "Tea Biscuits 168g",
    nameAr: "بسكويت شاي 168 غرام",
    description: "Light crisp biscuits, the companion of evening tea.",
    descriptionAr: "بسكويت خفيف مقرمش رفيق شاي المساء.",
    purchasePrice: 5500,
    sellingPrice: 8000,
    minQuantity: 23,
    categoryId: 7,
    supplierId: 6,
  },
  {
    name: "Potato Chips 100g",
    nameAr: "شيبس بطاطا 100 غرام",
    description: "Thin-sliced fried potatoes with salt.",
    descriptionAr: "رقائق بطاطا مقلية رقيقة مع الملح.",
    purchasePrice: 6500,
    sellingPrice: 9000,
    minQuantity: 23,
    categoryId: 7,
    supplierId: 6,
  },
  {
    name: "Halva with Pistachio 400g",
    nameAr: "حلاوة طحينية بالفستق 400 غرام",
    description: "Traditional tahini halva topped with pistachios.",
    descriptionAr: "حلاوة طحينية تقليدية مغطاة بالفستق الحلبي.",
    purchasePrice: 20000,
    sellingPrice: 27000,
    minQuantity: 10,
    categoryId: 7,
    supplierId: 6,
  },

  // ---- Cleaning & Household (category 8, supplier 7) ----
  {
    name: "Laundry Detergent Powder 2kg",
    nameAr: "مسحوق غسيل 2 كيلو",
    description: "High-foam washing powder with fresh scent.",
    descriptionAr: "مسحوق غسيل رغوي برائحة منعشة.",
    purchasePrice: 42000,
    sellingPrice: 56000,
    minQuantity: 8,
    categoryId: 8,
    supplierId: 7,
  },
  {
    name: "Dish Soap 1L",
    nameAr: "صابون أطباق سائل 1 لتر",
    description: "Concentrated lemon dish-washing liquid.",
    descriptionAr: "سائل أطباق مركز برائحة الليمون.",
    purchasePrice: 8000,
    sellingPrice: 11000,
    minQuantity: 15,
    categoryId: 8,
    supplierId: 7,
  },
  {
    name: "Bleach 1L",
    nameAr: "كلور معقم 1 لتر",
    description: "Disinfectant bleach for floors and bathrooms.",
    descriptionAr: "كلور معقم للأرضيات والحمامات.",
    purchasePrice: 5000,
    sellingPrice: 7500,
    minQuantity: 15,
    categoryId: 8,
    supplierId: 7,
  },
];

function priceTier(sellingPrice: number): "cheap" | "mid" | "expensive" {
  if (sellingPrice <= 10_000) return "cheap";
  if (sellingPrice <= 60_000) return "mid";
  return "expensive";
}

const LOW_STOCK_STORY: Record<number, number> = {
  7: 18,
  31: 14,
};

// Quantity purchased on top of what was already sold/ordered, so the store keeps
// some shelf stock without tying up more cash than its sales can cover.
const RESTOCK_BUFFER_BY_TIER: Record<"cheap" | "mid" | "expensive", [number, number]> = {
  cheap: [20, 45],
  mid: [12, 24],
  expensive: [2, 5],
};

export const PRODUCTS: CatalogProduct[] = RAW_PRODUCTS.map((p, idx) => ({
  ...p,
  id: idx + 1,
  barcode: String(6_220_000_000_000 + idx + 1),
}));

export const PRODUCT_COUNT = PRODUCTS.length;

export function productById(id: number): CatalogProduct {
  return PRODUCTS[id - 1]!;
}

export function productsByCategory(categoryId: number): CatalogProduct[] {
  return PRODUCTS.filter((p) => p.categoryId === categoryId);
}

export function productsBySupplier(supplierId: number): CatalogProduct[] {
  return PRODUCTS.filter((p) => p.supplierId === supplierId);
}

export function restockQuantity(productId: number, demanded = 0): number {
  const pinned = LOW_STOCK_STORY[productId];
  if (pinned !== undefined) return pinned;
  const product = productById(productId);
  const [min, max] = RESTOCK_BUFFER_BY_TIER[priceTier(product.sellingPrice)];
  const buffer = Math.floor(min + random() * (max - min));
  return demanded + buffer;
}

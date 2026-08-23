import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logger } from "@/utils";

export interface SeedPhoto {
  storedFileId: string;
  originalname: string;
  mimetype: string;
  size: number;
}

export const categoryImageUrl = (storedFileId: string) => `/category/image/download/${storedFileId}`;
export const productPhotoUrl = (storedFileId: string) => `/product-photo/download/${storedFileId}`;
export const uploadsFileUrl = (storedFileId: string) => `/uploads/${storedFileId}`;

const UPLOADS_DIR = path.resolve("uploads");
const MAX_SLUG_WORDS = 6;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .split("-")
    .filter(Boolean)
    .slice(0, MAX_SLUG_WORDS)
    .join("-");
}

export function placeholderPhoto(kind: string, id: number | string, label: string): SeedPhoto {
  const storedFileId = `replace-me-${kind}-${id}-${slugify(label)}.png`;
  return { storedFileId, originalname: storedFileId, mimetype: "image/png", size: 0 };
}

export function storedFileCreateManyInput(photo: SeedPhoto) {
  return {
    id: photo.storedFileId,
    originalname: photo.originalname,
    mimetype: photo.mimetype,
    path: path.posix.join("uploads", photo.storedFileId),
    size: photo.size,
  };
}

export function ensureSeedPhotoFiles(photos: SeedPhoto[]): void {
  mkdirSync(UPLOADS_DIR, { recursive: true });
  for (const photo of photos) {
    const target = path.join(UPLOADS_DIR, photo.storedFileId);
    if (existsSync(target)) continue;
    // Create a placeholder file with roughly the expected size so DB `size` stays consistent
    // even when the real image is missing. We write zeros to match the stored size;
    // replace with a real image later if needed.
    if (photo.size > 0) {
      writeFileSync(target, Buffer.alloc(photo.size));
    } else {
      writeFileSync(target, "");
    }
    logger.warn({
      caller: "ensureSeedPhotoFiles",
      value: `Created placeholder file uploads/${photo.storedFileId} (${photo.size} bytes) — replace it with a real image.`,
    });
  }
}

// ---------------------------------------------------------------------------
// Actual seeded photo data — extracted from current DB content (52 StoredFiles)
// 8 category images + 44 product photos (41 products, 3 extras for product 1 & 4)
// ---------------------------------------------------------------------------

export const CATEGORY_PHOTO_SEEDS: SeedPhoto[] = [
  {
    storedFileId: "b95f23f5f9cb8d6b60b959f0866ad863",
    originalname: "replace-me-category-1-vegetables.png",
    mimetype: "image/jpeg",
    size: 6651,
  },
  {
    storedFileId: "19e48b3b30989f53d0d7e235f1e2a33d",
    originalname: "replace-me-category-2-fruits.png",
    mimetype: "image/png",
    size: 68338,
  },
  {
    storedFileId: "dfd65b9b0c1a7d3aa5a5aa79c90301b1",
    originalname: "replace-me-category-3-dairy-eggs.png",
    mimetype: "image/png",
    size: 196972,
  },
  {
    storedFileId: "0a4281f7ca7482579bab2c187c277e34",
    originalname: "images.jpeg",
    mimetype: "image/jpeg",
    size: 37231,
  },
  {
    storedFileId: "1ec49cb27f0074d503764acc3ec4e75c",
    originalname: "replace-me-category-5-grains-legumes.png",
    mimetype: "image/png",
    size: 73902,
  },
  {
    storedFileId: "e09196907870d0165028c20298f638ad",
    originalname: "replace-me-category-6-pantry-oil.png",
    mimetype: "image/png",
    size: 384302,
  },
  {
    storedFileId: "133866ac7560e8e56800b08ecd7b8c56",
    originalname: "images.jpeg",
    mimetype: "image/jpeg",
    size: 57085,
  },
  {
    storedFileId: "a8ff561e8c009efebf0bc23b0f28d3ff",
    originalname: "replace-me-category-8-cleaning-household.png",
    mimetype: "image/png",
    size: 158338,
  },
];

// StoredFiles for product photos — 44 entries as currently in DB
export const PRODUCT_STORED_FILE_SEEDS: SeedPhoto[] = [
  {
    storedFileId: "8f4c2a91e7d34b6fa0d5c2e81b9f7a3c",
    originalname: "local-tomato.png",
    mimetype: "image/png",
    size: 118402,
  },
  {
    storedFileId: "a9f33d1284137a790002a42635e96e1e",
    originalname: "images (3).jpeg",
    mimetype: "image/jpeg",
    size: 45317,
  },
  {
    storedFileId: "47ffa5b85d836dab23416d6f380a3f8e",
    originalname: "images.jpeg",
    mimetype: "image/jpeg",
    size: 16927,
  },
  {
    storedFileId: "e29d15f46c2ca031db0de7ddb6ffc246",
    originalname: "images (1).jpeg",
    mimetype: "image/jpeg",
    size: 18034,
  },
  {
    storedFileId: "730535dee2342bcfe6d82aaca479e939",
    originalname: "istock_000017061174small-29488d97c3dd983c6130405fcee3df11a4d624c1.jpg",
    mimetype: "image/jpeg",
    size: 231674,
  },
  {
    storedFileId: "9539c96b4bb33c09985404717ec96a4e",
    originalname: "istock_000017061174small-29488d97c3dd983c6130405fcee3df11a4d624c1.jpg",
    mimetype: "image/jpeg",
    size: 231674,
  },
  {
    storedFileId: "62e60509552366519f0b7dde351e2dd9",
    originalname: "download (1).jpeg",
    mimetype: "image/jpeg",
    size: 5402,
  },
  {
    storedFileId: "cfa240aa9ed6084813a2d2aeb3be68f7",
    originalname: "download (2).jpeg",
    mimetype: "image/jpeg",
    size: 5619,
  },
  {
    storedFileId: "4a1508cbeda621f4f296fdfd33679b89",
    originalname: "images.jpeg",
    mimetype: "image/jpeg",
    size: 12473,
  },
  {
    storedFileId: "ff61bfd80f9b254244c0a1c7c39cafbf",
    originalname: "download (3).jpeg",
    mimetype: "image/jpeg",
    size: 3082,
  },
  {
    storedFileId: "6adf05aa16227e96c4f0704065e570fd",
    originalname: "images.jpeg",
    mimetype: "image/jpeg",
    size: 22767,
  },
  {
    storedFileId: "0d74d2679d3ffc3bfe419ef0770919de",
    originalname: "download.jpeg",
    mimetype: "image/jpeg",
    size: 8438,
  },
  {
    storedFileId: "f81b34a9a77cbcb4806cd1a42823457f",
    originalname: "download (1).jpeg",
    mimetype: "image/jpeg",
    size: 9070,
  },
  {
    storedFileId: "c04c59a40c274c86ed8cd001ac18d2c1",
    originalname: "download (2).jpeg",
    mimetype: "image/jpeg",
    size: 4764,
  },
  {
    storedFileId: "30737eba20deb0d4bf43bf4436d4f617",
    originalname: "download (3).jpeg",
    mimetype: "image/jpeg",
    size: 3672,
  },
  {
    storedFileId: "7c374c39f6521ad66df5012ea024b1a3",
    originalname: "download (4).jpeg",
    mimetype: "image/jpeg",
    size: 7792,
  },
  {
    storedFileId: "645cae59f84f452ea19c2cbce10b28ee",
    originalname: "download (5).jpeg",
    mimetype: "image/jpeg",
    size: 9870,
  },
  {
    storedFileId: "f9409cf02a310a959d8ecc420ab582de",
    originalname: "images (1).jpeg",
    mimetype: "image/jpeg",
    size: 30835,
  },
  {
    storedFileId: "815cd968ffb9cb9d29763eb8c8a64b9c",
    originalname: "images (2).jpeg",
    mimetype: "image/jpeg",
    size: 33918,
  },
  {
    storedFileId: "d0b2898cbfd480e36735883954850ee5",
    originalname: "images (3).jpeg",
    mimetype: "image/jpeg",
    size: 47059,
  },
  {
    storedFileId: "f346a60207b84cbb0fce0a80c7dea6e9",
    originalname: "download (6).jpeg",
    mimetype: "image/jpeg",
    size: 12147,
  },
  {
    storedFileId: "f19a1f2fcf77e22117fff02a39d4d105",
    originalname: "download (7).jpeg",
    mimetype: "image/jpeg",
    size: 8853,
  },
  {
    storedFileId: "0582409b8ef6854e77507440811a2f49",
    originalname: "images (4).jpeg",
    mimetype: "image/jpeg",
    size: 43848,
  },
  {
    storedFileId: "f2720bceecacea47be2a39395238e0f7",
    originalname: "images.jpeg",
    mimetype: "image/jpeg",
    size: 33520,
  },
  {
    storedFileId: "3f9188b9f68eae629bcf754e83e4a82f",
    originalname: "download.jpeg",
    mimetype: "image/jpeg",
    size: 7162,
  },
  {
    storedFileId: "e9a95000e70bef9b9897caadb73bb789",
    originalname: "images.jpeg",
    mimetype: "image/jpeg",
    size: 20873,
  },
  {
    storedFileId: "eabbf88f04603fbf64ffc05df5906abe",
    originalname: "images (1).jpeg",
    mimetype: "image/jpeg",
    size: 26091,
  },
  {
    storedFileId: "4d7163a044daa34a5fb9091cd3dec8ba",
    originalname: "download.jpeg",
    mimetype: "image/jpeg",
    size: 7279,
  },
  {
    storedFileId: "4d38b4cd30375f70c9511de0843f9ae9",
    originalname: "images (2).jpeg",
    mimetype: "image/jpeg",
    size: 28067,
  },
  {
    storedFileId: "31a1d0f8886ae54cb9a8b09c4bd72bd7",
    originalname: "images (4).jpeg",
    mimetype: "image/jpeg",
    size: 27235,
  },
  {
    storedFileId: "47c04342f0e9d6a0b6c39995c9dba9b2",
    originalname: "images (5).jpeg",
    mimetype: "image/jpeg",
    size: 61609,
  },
  { storedFileId: "2e4c1edf2dc5bac67b1e062f52247ee3", originalname: "images.jpg", mimetype: "image/jpeg", size: 57194 },
  {
    storedFileId: "7d744dffb57ea8a30775d003c5a05e26",
    originalname: "download (2).jpeg",
    mimetype: "image/jpeg",
    size: 11424,
  },
  {
    storedFileId: "db92512722e2bb1878eb899a95f92ea9",
    originalname: "images.jpeg",
    mimetype: "image/jpeg",
    size: 30295,
  },
  {
    storedFileId: "165d7a17cdb99035126ee9a57ffaa1a6",
    originalname: "images (1).jpeg",
    mimetype: "image/jpeg",
    size: 32812,
  },
  {
    storedFileId: "4048b35e08d64ed283b7fa3fec087c2b",
    originalname: "images (2).jpeg",
    mimetype: "image/jpeg",
    size: 38166,
  },
  {
    storedFileId: "edfc85950fed7f9d8b8cb6f29fbf2f98",
    originalname: "download.jpeg",
    mimetype: "image/jpeg",
    size: 12109,
  },
  {
    storedFileId: "02cf0354f917cd83fe43abda1d471e92",
    originalname: "images (3).jpeg",
    mimetype: "image/jpeg",
    size: 18656,
  },
  {
    storedFileId: "d229f46bc748ddeb98b0d56f7d3197ad",
    originalname: "images (4).jpeg",
    mimetype: "image/jpeg",
    size: 26960,
  },
  {
    storedFileId: "8b464342d6d6257eb52ec74e72cf7a39",
    originalname: "download (1).jpeg",
    mimetype: "image/jpeg",
    size: 7666,
  },
  {
    storedFileId: "016ffb22dfd28f589688348e669b7bb5",
    originalname: "images (5).jpeg",
    mimetype: "image/jpeg",
    size: 5605,
  },
  // extra photos for products with multiple images (product 1 x2, product 4 x1)
  {
    storedFileId: "251a9111cb7649ea96bed17b10140a7b",
    originalname: "download (1).jpeg",
    mimetype: "image/jpeg",
    size: 5991,
  },
  {
    storedFileId: "6bf201c1b953d0c42a57c348f39e8854",
    originalname: "download (2).jpeg",
    mimetype: "image/jpeg",
    size: 5991,
  },
  {
    storedFileId: "391d6ed34dcb168ed202fc3abbb79612",
    originalname: "images (1) (1).jpeg",
    mimetype: "image/jpeg",
    size: 18034,
  },
];

// Mapping productId -> primary storedFileId (used for Product.imageUrl)
// Covers all 41 products
export const PRODUCT_PRIMARY_PHOTO_MAP: Record<number, string> = {
  1: "8f4c2a91e7d34b6fa0d5c2e81b9f7a3c",
  2: "a9f33d1284137a790002a42635e96e1e",
  3: "47ffa5b85d836dab23416d6f380a3f8e",
  4: "e29d15f46c2ca031db0de7ddb6ffc246",
  5: "730535dee2342bcfe6d82aaca479e939",
  6: "9539c96b4bb33c09985404717ec96a4e",
  7: "62e60509552366519f0b7dde351e2dd9",
  8: "cfa240aa9ed6084813a2d2aeb3be68f7",
  9: "4a1508cbeda621f4f296fdfd33679b89",
  10: "ff61bfd80f9b254244c0a1c7c39cafbf",
  11: "6adf05aa16227e96c4f0704065e570fd",
  12: "0d74d2679d3ffc3bfe419ef0770919de",
  13: "f81b34a9a77cbcb4806cd1a42823457f",
  14: "c04c59a40c274c86ed8cd001ac18d2c1",
  15: "30737eba20deb0d4bf43bf4436d4f617",
  16: "7c374c39f6521ad66df5012ea024b1a3",
  17: "645cae59f84f452ea19c2cbce10b28ee",
  18: "f9409cf02a310a959d8ecc420ab582de",
  19: "815cd968ffb9cb9d29763eb8c8a64b9c",
  20: "d0b2898cbfd480e36735883954850ee5",
  21: "f346a60207b84cbb0fce0a80c7dea6e9",
  22: "f19a1f2fcf77e22117fff02a39d4d105",
  23: "0582409b8ef6854e77507440811a2f49",
  24: "f2720bceecacea47be2a39395238e0f7",
  25: "3f9188b9f68eae629bcf754e83e4a82f",
  26: "e9a95000e70bef9b9897caadb73bb789",
  27: "eabbf88f04603fbf64ffc05df5906abe",
  28: "4d7163a044daa34a5fb9091cd3dec8ba",
  29: "4d38b4cd30375f70c9511de0843f9ae9",
  30: "31a1d0f8886ae54cb9a8b09c4bd72bd7",
  31: "47c04342f0e9d6a0b6c39995c9dba9b2",
  32: "2e4c1edf2dc5bac67b1e062f52247ee3",
  33: "7d744dffb57ea8a30775d003c5a05e26",
  34: "db92512722e2bb1878eb899a95f92ea9",
  35: "165d7a17cdb99035126ee9a57ffaa1a6",
  36: "4048b35e08d64ed283b7fa3fec087c2b",
  37: "edfc85950fed7f9d8b8cb6f29fbf2f98",
  38: "02cf0354f917cd83fe43abda1d471e92",
  39: "d229f46bc748ddeb98b0d56f7d3197ad",
  40: "8b464342d6d6257eb52ec74e72cf7a39",
  41: "016ffb22dfd28f589688348e669b7bb5",
};

// Full ProductPhoto linking — 44 entries preserving current DB productId -> storedFileId mapping
// Includes extras: product 1 has 3 photos, product 4 has 2
export const PRODUCT_PHOTO_LINKS: Array<{ productId: number; storedFileId: string; creatorId: number }> = [
  { productId: 1, storedFileId: "8f4c2a91e7d34b6fa0d5c2e81b9f7a3c", creatorId: 1 },
  { productId: 2, storedFileId: "a9f33d1284137a790002a42635e96e1e", creatorId: 1 },
  { productId: 3, storedFileId: "47ffa5b85d836dab23416d6f380a3f8e", creatorId: 1 },
  { productId: 4, storedFileId: "e29d15f46c2ca031db0de7ddb6ffc246", creatorId: 1 },
  { productId: 5, storedFileId: "730535dee2342bcfe6d82aaca479e939", creatorId: 1 },
  { productId: 6, storedFileId: "9539c96b4bb33c09985404717ec96a4e", creatorId: 1 },
  { productId: 7, storedFileId: "62e60509552366519f0b7dde351e2dd9", creatorId: 1 },
  { productId: 8, storedFileId: "cfa240aa9ed6084813a2d2aeb3be68f7", creatorId: 1 },
  { productId: 9, storedFileId: "4a1508cbeda621f4f296fdfd33679b89", creatorId: 1 },
  { productId: 10, storedFileId: "ff61bfd80f9b254244c0a1c7c39cafbf", creatorId: 1 },
  { productId: 11, storedFileId: "6adf05aa16227e96c4f0704065e570fd", creatorId: 1 },
  { productId: 12, storedFileId: "0d74d2679d3ffc3bfe419ef0770919de", creatorId: 1 },
  { productId: 13, storedFileId: "f81b34a9a77cbcb4806cd1a42823457f", creatorId: 1 },
  { productId: 14, storedFileId: "c04c59a40c274c86ed8cd001ac18d2c1", creatorId: 1 },
  { productId: 15, storedFileId: "30737eba20deb0d4bf43bf4436d4f617", creatorId: 1 },
  { productId: 16, storedFileId: "7c374c39f6521ad66df5012ea024b1a3", creatorId: 1 },
  { productId: 17, storedFileId: "645cae59f84f452ea19c2cbce10b28ee", creatorId: 1 },
  { productId: 18, storedFileId: "f9409cf02a310a959d8ecc420ab582de", creatorId: 1 },
  { productId: 19, storedFileId: "815cd968ffb9cb9d29763eb8c8a64b9c", creatorId: 1 },
  { productId: 20, storedFileId: "d0b2898cbfd480e36735883954850ee5", creatorId: 1 },
  { productId: 21, storedFileId: "f346a60207b84cbb0fce0a80c7dea6e9", creatorId: 1 },
  { productId: 22, storedFileId: "f19a1f2fcf77e22117fff02a39d4d105", creatorId: 1 },
  { productId: 23, storedFileId: "0582409b8ef6854e77507440811a2f49", creatorId: 1 },
  { productId: 24, storedFileId: "f2720bceecacea47be2a39395238e0f7", creatorId: 1 },
  { productId: 25, storedFileId: "3f9188b9f68eae629bcf754e83e4a82f", creatorId: 1 },
  { productId: 26, storedFileId: "e9a95000e70bef9b9897caadb73bb789", creatorId: 1 },
  { productId: 27, storedFileId: "eabbf88f04603fbf64ffc05df5906abe", creatorId: 1 },
  { productId: 28, storedFileId: "4d7163a044daa34a5fb9091cd3dec8ba", creatorId: 1 },
  { productId: 29, storedFileId: "4d38b4cd30375f70c9511de0843f9ae9", creatorId: 1 },
  { productId: 30, storedFileId: "31a1d0f8886ae54cb9a8b09c4bd72bd7", creatorId: 1 },
  { productId: 31, storedFileId: "47c04342f0e9d6a0b6c39995c9dba9b2", creatorId: 1 },
  { productId: 32, storedFileId: "2e4c1edf2dc5bac67b1e062f52247ee3", creatorId: 1 },
  { productId: 33, storedFileId: "7d744dffb57ea8a30775d003c5a05e26", creatorId: 1 },
  { productId: 34, storedFileId: "db92512722e2bb1878eb899a95f92ea9", creatorId: 1 },
  { productId: 35, storedFileId: "165d7a17cdb99035126ee9a57ffaa1a6", creatorId: 1 },
  { productId: 36, storedFileId: "4048b35e08d64ed283b7fa3fec087c2b", creatorId: 1 },
  { productId: 37, storedFileId: "edfc85950fed7f9d8b8cb6f29fbf2f98", creatorId: 1 },
  { productId: 38, storedFileId: "02cf0354f917cd83fe43abda1d471e92", creatorId: 1 },
  { productId: 39, storedFileId: "d229f46bc748ddeb98b0d56f7d3197ad", creatorId: 1 },
  { productId: 40, storedFileId: "8b464342d6d6257eb52ec74e72cf7a39", creatorId: 1 },
  { productId: 41, storedFileId: "016ffb22dfd28f589688348e669b7bb5", creatorId: 1 },
  // extras
  { productId: 1, storedFileId: "251a9111cb7649ea96bed17b10140a7b", creatorId: 1 },
  { productId: 1, storedFileId: "6bf201c1b953d0c42a57c348f39e8854", creatorId: 1 },
  { productId: 4, storedFileId: "391d6ed34dcb168ed202fc3abbb79612", creatorId: 1 },
];

import path from "node:path";
import type { PrismaTransactionClient } from "./data/generators";

export const PRODUCT_PHOTO_STORED_FILE_ID = "8f4c2a91e7d34b6fa0d5c2e81b9f7a3c";
const PRODUCT_PHOTO_PATH = path.posix.join("uploads", PRODUCT_PHOTO_STORED_FILE_ID);

export async function seedProductPhotos(tx: PrismaTransactionClient) {
  await tx.storedFile.create({
    data: {
      id: PRODUCT_PHOTO_STORED_FILE_ID,
      originalname: "local-tomato.png",
      mimetype: "image/png",
      path: PRODUCT_PHOTO_PATH,
      size: 118_402,
      productPhotos: {
        create: [
          {
            id: 1,
            creatorId: 1,
            productId: 1,
          },
        ],
      },
    },
  });

  await tx.product.update({
    where: { id: 1 },
    data: { imageUrl: `/product-photo/download/${PRODUCT_PHOTO_STORED_FILE_ID}` },
  });
}

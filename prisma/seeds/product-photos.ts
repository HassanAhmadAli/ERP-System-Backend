import path from "node:path";
import type { PrismaTransactionClient } from "./data/generators";

export const PRODUCT_PHOTO_STORED_FILE_ID = "17607250278bc4d093eb101bff9234d8";
const PRODUCT_PHOTO_PATH = path.posix.join("uploads", PRODUCT_PHOTO_STORED_FILE_ID);

export async function seedProductPhotos(tx: PrismaTransactionClient) {
  await tx.storedFile.create({
    data: {
      id: PRODUCT_PHOTO_STORED_FILE_ID,
      originalname: "product-photo-wireless-mouse.png",
      mimetype: "image/png",
      path: PRODUCT_PHOTO_PATH,
      size: 94927,
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

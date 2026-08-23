import type { PrismaTransactionClient } from "./data/generators";
import {
  PRODUCT_PHOTO_LINKS,
  PRODUCT_PRIMARY_PHOTO_MAP,
  PRODUCT_STORED_FILE_SEEDS,
  ensureSeedPhotoFiles,
  productPhotoUrl,
  storedFileCreateManyInput,
} from "./photos";

export async function seedProductPhotos(tx: PrismaTransactionClient) {
  // Ensure files exist on disk (uploads/*.jpeg) — creates empty placeholders if missing
  ensureSeedPhotoFiles(PRODUCT_STORED_FILE_SEEDS);

  // Create StoredFile rows for all product photos (44 files)
  await tx.storedFile.createMany({ data: PRODUCT_STORED_FILE_SEEDS.map(storedFileCreateManyInput) });

  // Create ProductPhoto linking rows — matches current DB: 44 photos (41 products, 3 extras)
  await tx.productPhoto.createMany({
    data: PRODUCT_PHOTO_LINKS.map((link) => ({
      creatorId: link.creatorId,
      productId: link.productId,
      storedFileId: link.storedFileId,
    })),
  });

  // Update every product's imageUrl to point at its primary photo (as in current DB)
  // All 41 products have at least one photo; product 1 and 4 have extras but imageUrl points to first.
  for (const [productIdStr, storedFileId] of Object.entries(PRODUCT_PRIMARY_PHOTO_MAP)) {
    const productId = Number(productIdStr);
    await tx.product.update({
      where: { id: productId },
      data: { imageUrl: productPhotoUrl(storedFileId) },
    });
  }
}

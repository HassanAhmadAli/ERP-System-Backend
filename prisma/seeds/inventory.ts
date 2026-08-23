import { PRODUCTS } from "./data/catalog";
import { purchasedQtyByProduct } from "./purchases";
import { soldQtyByProduct } from "./sales";
import { orderedQtyByProduct } from "./orders";

export function stockOnHand(): Map<number, number> {
  const stock = new Map<number, number>();

  for (const product of PRODUCTS) {
    const purchased = purchasedQtyByProduct.get(product.id) ?? 0;
    const sold = soldQtyByProduct.get(product.id) ?? 0;
    const ordered = orderedQtyByProduct.get(product.id) ?? 0;
    stock.set(product.id, Math.max(0, purchased - sold - ordered));
  }

  return stock;
}

export interface LowStockEntry {
  productId: number;
  name: string;
  nameAr: string;
  quantityInStock: number;
  minQuantity: number;
}

export function lowStockProducts(): LowStockEntry[] {
  const stock = stockOnHand();
  return PRODUCTS.filter((product) => (stock.get(product.id) ?? 0) <= product.minQuantity).map((product) => ({
    productId: product.id,
    name: product.name,
    nameAr: product.nameAr,
    quantityInStock: stock.get(product.id)!,
    minQuantity: product.minQuantity,
  }));
}

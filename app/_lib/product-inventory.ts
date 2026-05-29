import type { StoreProduct } from "./store-types";

export function getRemainingInventory(product: StoreProduct) {
  if (product.kind === "JEWELLERY") {
    return Math.max(0, product.stockQuantity ?? 1);
  }

  return product.sizes.reduce((sum, size) => sum + Math.max(0, size.quantityAvailable), 0);
}

export function isProductOutOfStock(product: StoreProduct) {
  return getRemainingInventory(product) <= 0;
}

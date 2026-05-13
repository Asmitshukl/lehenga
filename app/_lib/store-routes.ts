import type { StoreProduct } from "./store-types";

export function getProductHref(product: Pick<StoreProduct, "kind" | "slug">) {
  return product.kind === "LEHENGA" ? `/lehengas/${product.slug}` : `/jewellery/${product.slug}`;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart } from "./cart-provider";
import { StoreProductImage } from "./store-product-image";
import { getRemainingInventory, isProductOutOfStock } from "../_lib/product-inventory";
import { getProductHref } from "../_lib/store-routes";
import type { StoreProduct } from "../_lib/store-types";

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 stroke-current">
      <path d="M10 2.75v14.5M2.75 10h14.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function StoreProductCard({ product }: { product: StoreProduct }) {
  const { addItem } = useCart();
  const router = useRouter();
  const href = getProductHref(product);
  const remainingInventory = getRemainingInventory(product);
  const isOutOfStock = isProductOutOfStock(product);

  return (
    <article className="product-card">
      <Link href={href} className="product-card-overlay" aria-label={`View ${product.name}`} />
      <div className="product-card-image-wrap">
        <StoreProductImage image={product.image} name={product.name} className="product-card-image" />
      </div>
      <div className="product-card-body">
        <div className="product-card-copy">
          <h3>{product.name}</h3>
          <p>RS {product.rentalPricePerDay.toLocaleString("en-IN")}/night</p>
          <p className={`product-card-stock${isOutOfStock ? " is-out" : ""}`}>
            {isOutOfStock ? "Out of stock" : `${remainingInventory} left`}
          </p>
        </div>
        <button
          type="button"
          aria-label={product.isMock || isOutOfStock ? `${product.name} is unavailable` : `Add ${product.name}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            if (product.kind === "LEHENGA") {
              router.push(href);
              return;
            }

            addItem(product);
          }}
          disabled={product.isMock || isOutOfStock}
        >
          <PlusIcon />
        </button>
      </div>
    </article>
  );
}

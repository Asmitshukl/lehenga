"use client";

import { useState } from "react";

import { useCart } from "./cart-provider";
import type { StoreProduct } from "../_lib/store-types";

export function ProductDetailActions({ product }: { product: StoreProduct }) {
  const { addItem } = useCart();
  const [selectedSizeId, setSelectedSizeId] = useState(product.sizes[0]?.id ?? "");

  return (
    <div className="product-detail-purchase">
      {product.kind === "LEHENGA" && product.sizes.length > 0 ? (
        <label className="product-detail-field">
          <span>Select size</span>
          <select value={selectedSizeId} onChange={(event) => setSelectedSizeId(event.target.value)}>
            {product.sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.sizeLabel} · {size.quantityAvailable} available
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button
        type="button"
        className="product-detail-primary-button"
        onClick={() => addItem(product, selectedSizeId || undefined)}
        disabled={product.isMock}
      >
        Add to cart
      </button>
    </div>
  );
}

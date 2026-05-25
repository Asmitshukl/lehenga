"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "./cart-provider";
import type { StoreProduct } from "../_lib/store-types";

export function ProductDetailActions({ product }: { product: StoreProduct }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [selectedSizeId, setSelectedSizeId] = useState(product.sizes[0]?.id ?? "");
  const today = new Date();
  const formattedStartDate = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleAddToCart = () => {
    addItem(product, selectedSizeId || undefined);
  };

  const handleBookNow = () => {
    addItem(product, selectedSizeId || undefined);
    router.push("/cart");
  };

  return (
    <div className="product-detail-purchase">
      <div className="product-detail-date-block">
        <span>Select Dates:</span>
        <div className="product-detail-date-row">
          <div className="product-detail-date-card">
            <small>Start Date</small>
            <strong>{formattedStartDate}</strong>
          </div>
          <div className="product-detail-date-separator">to</div>
          <div className="product-detail-date-card is-placeholder">Return Date</div>
        </div>
      </div>

      {product.kind === "LEHENGA" && product.sizes.length > 1 ? (
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

      <p className="product-detail-availability">
        Status: <strong>{product.isMock ? "Preview" : "Available"}</strong>
      </p>
      <p className="product-detail-price-emphasis">
        Price: <strong>RS {product.rentalPricePerDay.toLocaleString("en-IN")}/night</strong>
      </p>

      <div className="product-detail-button-row">
        <button
          type="button"
          className="product-detail-secondary-button"
          onClick={handleAddToCart}
          disabled={product.isMock}
        >
          Add to Cart
        </button>
        <button
          type="button"
          className="product-detail-primary-button"
          onClick={handleBookNow}
          disabled={product.isMock}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

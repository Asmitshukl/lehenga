"use client";

import { useState } from "react";

import { StoreProductImage } from "./store-product-image";
import type { ProductImage } from "../_lib/store-types";

export function ProductGallery({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: ProductImage[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] ?? images[0];
  const hasMultipleImages = images.length > 1;

  function showPrevious() {
    setSelectedIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNext() {
    setSelectedIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  }

  return (
    <div className="product-detail-gallery">
      <div className="product-detail-primary-image product-detail-carousel">
        {hasMultipleImages ? (
          <button
            type="button"
            className="product-detail-carousel-button is-left"
            onClick={showPrevious}
            aria-label="Show previous image"
          >
            ‹
          </button>
        ) : null}
        <StoreProductImage image={selectedImage.url} name={productName} className="product-detail-image" />
        {hasMultipleImages ? (
          <button
            type="button"
            className="product-detail-carousel-button is-right"
            onClick={showNext}
            aria-label="Show next image"
          >
            ›
          </button>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="product-detail-thumbnail-grid">
          {images.map((image, index) => (
            <button
              key={`${productId}-${index}`}
              type="button"
              className={`product-detail-thumbnail${selectedIndex === index ? " is-active" : ""}`}
              onClick={() => setSelectedIndex(index)}
            >
              <StoreProductImage
                image={image.url}
                name={image.altText ?? `${productName} view ${index + 1}`}
                className="product-detail-thumbnail-image"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { StoreProductCard } from "./store-product-card";
import type { StoreCategory } from "../_lib/store-types";

const PAGE_SIZE = 12;

export function CategoryProductSections({ categories }: { categories: StoreCategory[] }) {
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!window.location.hash) return;
    const timer = window.setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" }), 0);
    return () => window.clearTimeout(timer);
  }, [categories]);

  return categories.map((category) => {
    const visibleCount = visibleCounts[category.id] ?? PAGE_SIZE;
    const visibleProducts = category.products.slice(0, visibleCount);

    return (
      <section key={category.id} id={`category-${category.slug}`} className="catalog-section scroll-anchor">
        <div className="section-row">
          <div>
            <h2>{category.name}</h2>
            {category.description ? <p>{category.description}</p> : null}
          </div>
          <span>{category.products.length} styles</span>
        </div>
        {category.products.length ? (
          <>
            <div className="product-grid-shell"><div className="product-grid">
              {visibleProducts.map((product) => <StoreProductCard key={`${category.id}-${product.kind}-${product.id}`} product={product} />)}
            </div></div>
            {visibleCount < category.products.length ? (
              <div className="show-more-row">
                <button className="discover-button" type="button" onClick={() => setVisibleCounts((current) => ({ ...current, [category.id]: visibleCount + PAGE_SIZE }))}>
                  Show more {category.name}
                </button>
              </div>
            ) : null}
          </>
        ) : <div className="cart-empty-state"><p>No products in this category yet.</p></div>}
      </section>
    );
  });
}

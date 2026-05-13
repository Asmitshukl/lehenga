"use client";

import { useEffect, useState } from "react";

import { StoreProductCard } from "@/app/_components/store-product-card";
import { fetchJewelleryProducts } from "@/app/_lib/store-api";
import type { StoreProduct } from "@/app/_lib/store-types";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

export default function JewelleryPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      const data = await fetchJewelleryProducts();

      if (!cancelled) {
        setProducts(data);
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="lehenga-page">
      <SiteHeader />

      <section className="shopall-section">
        <div className="shopall-breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-muted">Home</span>
          <span className="breadcrumb-sep" aria-hidden="true">
            &gt;
          </span>
          <span>Jewellery</span>
        </div>

        <div className="product-grid-shell">
          <div className="product-grid">
            {products.map((product) => (
              <StoreProductCard key={`${product.kind}-${product.id}`} product={product} />
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="cart-empty-state">
            <p>No jewellery has been added yet.</p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}

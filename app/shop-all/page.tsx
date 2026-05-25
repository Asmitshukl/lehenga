"use client";

import { useEffect, useState } from "react";

import { StoreBreadcrumb } from "@/app/_components/store-breadcrumb";
import { StoreProductCard } from "@/app/_components/store-product-card";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

import { fetchLiveProducts } from "../_lib/store-api";
import type { StoreProduct } from "../_lib/store-types";

export default function ShopAllPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      const liveProducts = await fetchLiveProducts();

      if (!cancelled) {
        setProducts(liveProducts);
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
        <StoreBreadcrumb items={[{ label: "Home", href: "/#home" }, { label: "Shop All" }]} />

        <div className="product-grid-shell">
          <div className="product-grid">
            {products.map((product, idx) => (
              <StoreProductCard key={`${product.kind}-${product.id}-${idx}`} product={product} />
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="cart-empty-state">
            <p>No lehengas are available right now.</p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}

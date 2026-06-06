"use client";

import { useEffect, useState } from "react";

import { StoreBreadcrumb } from "@/app/_components/store-breadcrumb";
import { CatalogError, CatalogLoader } from "@/app/_components/catalog-request-state";
import { StoreProductCard } from "@/app/_components/store-product-card";
import { fetchJewelleryProductsOrThrow } from "@/app/_lib/store-api";
import type { StoreProduct } from "@/app/_lib/store-types";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

export default function JewelleryPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrySignal, setRetrySignal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchJewelleryProductsOrThrow();

        if (!cancelled) {
          setProducts(data);
        }
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "The catalog service is unavailable.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [retrySignal]);

  return (
    <main className="lehenga-page">
      <SiteHeader />

      <section className="shopall-section">
        <StoreBreadcrumb items={[{ label: "Home", href: "/#home" }, { label: "Jewellery" }]} />

        {loading ? <CatalogLoader label="Loading jewellery" /> : null}
        {error ? <CatalogError message={error} onRetry={() => setRetrySignal((value) => value + 1)} /> : null}

        {!loading && !error ? <div className="product-grid-shell">
          <div className="product-grid">
            {products.map((product) => (
              <StoreProductCard key={`${product.kind}-${product.id}`} product={product} />
            ))}
          </div>
        </div> : null}

        {!loading && !error && products.length === 0 ? (
          <div className="cart-empty-state">
            <p>No jewellery has been added yet.</p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}

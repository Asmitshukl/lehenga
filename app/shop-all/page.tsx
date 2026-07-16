"use client";

import { useEffect, useState } from "react";

import { StoreBreadcrumb } from "@/app/_components/store-breadcrumb";
import { CatalogError, CatalogLoader } from "@/app/_components/catalog-request-state";
import { CategoryProductSections } from "@/app/_components/category-product-sections";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

import { fetchCategoriesOrThrow } from "../_lib/store-api";
import type { StoreCategory } from "../_lib/store-types";

export default function ShopAllPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrySignal, setRetrySignal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const liveCategories = await fetchCategoriesOrThrow();

        if (!cancelled) {
          setCategories(liveCategories);
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
        <StoreBreadcrumb items={[{ label: "Home", href: "/#home" }, { label: "Shop All" }]} />

        {loading ? <CatalogLoader label="Loading lehengas" /> : null}
        {error ? <CatalogError message={error} onRetry={() => setRetrySignal((value) => value + 1)} /> : null}

        {!loading && !error ? <CategoryProductSections categories={categories} /> : null}

        {!loading && !error && categories.length === 0 ? (
          <div className="cart-empty-state">
            <p>No lehengas are available right now.</p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}

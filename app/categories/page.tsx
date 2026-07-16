"use client";

import { useEffect, useState } from "react";

import { StoreBreadcrumb } from "@/app/_components/store-breadcrumb";
import { CatalogError, CatalogLoader } from "@/app/_components/catalog-request-state";
import { CategoryProductSections } from "@/app/_components/category-product-sections";
import { fetchCategoriesOrThrow } from "@/app/_lib/store-api";
import type { StoreCategory } from "@/app/_lib/store-types";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrySignal, setRetrySignal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCategoriesOrThrow();

        if (!cancelled) {
          setCategories(data);
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

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [retrySignal]);

  return (
    <main className="lehenga-page">
      <SiteHeader />
      <section className="shopall-section">
        <StoreBreadcrumb items={[{ label: "Home", href: "/#home" }, { label: "Categories" }]} />

        {loading ? <CatalogLoader label="Loading categories" /> : null}
        {error ? <CatalogError message={error} onRetry={() => setRetrySignal((value) => value + 1)} /> : null}

        {!loading && !error ? <CategoryProductSections categories={categories} /> : null}

        {!loading && !error && categories.length === 0 ? (
          <section className="catalog-section">
            <div className="product-grid-shell">
              <div className="cart-empty-state">
                <p>No categories are available right now.</p>
              </div>
            </div>
          </section>
        ) : null}
      </section>
      <SiteFooter />
    </main>
  );
}

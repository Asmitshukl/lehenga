"use client";

import { useEffect, useState } from "react";

import { StoreBreadcrumb } from "@/app/_components/store-breadcrumb";
import { CatalogError, CatalogLoader } from "@/app/_components/catalog-request-state";
import { StoreProductCard } from "@/app/_components/store-product-card";
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

        {!loading && !error ? categories.map((category) => {
          const lehengaCount = category.products.filter((product) => product.kind === "LEHENGA").length;
          const jewelleryCount = category.products.filter((product) => product.kind === "JEWELLERY").length;

          return (
            <section key={category.id} className="catalog-section">
              <div className="section-row">
                <div>
                  <h2>{category.name}</h2>
                  <p>
                    {lehengaCount} lehenga style(s) · {jewelleryCount} jewellery style(s)
                    {category.isFeatured ? " · Featured category" : ""}
                  </p>
                </div>
                <span>{category.products.length} styles</span>
              </div>

              {category.products.length > 0 ? (
                <div className="product-grid-shell">
                  <div className="product-grid">
                    {category.products.map((product) => (
                      <StoreProductCard key={`${category.id}-${product.kind}-${product.id}`} product={product} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="cart-empty-state">
                  <p>No products in this category yet.</p>
                </div>
              )}
            </section>
          );
        }) : null}

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

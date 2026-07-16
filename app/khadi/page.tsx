"use client";

import { useEffect, useState } from "react";
import { CategoryProductSections } from "../_components/category-product-sections";
import { CatalogError, CatalogLoader } from "../_components/catalog-request-state";
import { StoreBreadcrumb } from "../_components/store-breadcrumb";
import { fetchCategoriesOrThrow } from "../_lib/store-api";
import type { StoreCategory } from "../_lib/store-types";
import { SiteFooter } from "../ui/site-footer";
import { SiteHeader } from "../ui/site-header";

export default function KhadiPage() {
  const [category, setCategory] = useState<StoreCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { void fetchCategoriesOrThrow().then((items) => setCategory(items.find((item) => item.slug === "khadi") ?? null)).catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load Khadi")).finally(() => setLoaded(true)); }, []);
  return <main className="lehenga-page"><SiteHeader /><section className="shopall-section">
    <StoreBreadcrumb items={[{ label: "Home", href: "/#home" }, { label: "Khadi" }]} />
    {!loaded && !error ? <CatalogLoader label="Loading Khadi collection" /> : null}
    {error ? <CatalogError message={error} onRetry={() => window.location.reload()} /> : null}
    {category ? <CategoryProductSections categories={[category]} /> : null}
    {loaded && !category && !error ? <div className="cart-empty-state"><p>The Khadi collection is coming soon.</p></div> : null}
  </section><SiteFooter /></main>;
}

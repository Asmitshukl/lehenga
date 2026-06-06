"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import heroImage from "@/photo/caiCUuW1TZ7czKzGUaaidkP3aAc.png";
import { CatalogError, CatalogLoader } from "@/app/_components/catalog-request-state";
import { StoreFaqSection, StorePromoBanner } from "@/app/_components/store-marketing-sections";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";
import { StoreProductCard } from "./_components/store-product-card";
import { fetchFeaturedCategoriesOrThrow, fetchLatestProductsOrThrow } from "./_lib/store-api";
import type { StoreCategory, StoreProduct } from "./_lib/store-types";

function ProductSection({
  id,
  title,
  href,
  products,
}: {
  id: string;
  title: string;
  href: string;
  products: StoreCategory["products"];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section id={id} className="catalog-section">
      <div className="section-row">
        <h2>{title}</h2>
        <Link href={href} className="discover-button">
          Discover more
        </Link>
      </div>

      <div className="product-grid-shell">
        <div className="product-grid">
          {products.map((product) => (
            <StoreProductCard key={`${id}-${product.kind}-${product.id}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function getLatestSectionProducts(products: StoreProduct[], limit = 4) {
  return [...products]
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

      return rightTime - leftTime;
    })
    .slice(0, limit);
}

export default function Home() {
  const [latestDrop, setLatestDrop] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [menuOpenSignal, setMenuOpenSignal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrySignal, setRetrySignal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadHomepage = async () => {
      setLoading(true);
      setError(null);

      try {
        const [liveLatestDrop, featuredCategories] = await Promise.all([
          fetchLatestProductsOrThrow(4),
          fetchFeaturedCategoriesOrThrow(5),
        ]);

        if (!cancelled) {
          setLatestDrop(liveLatestDrop);
          setCategories(featuredCategories);
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

    void loadHomepage();

    return () => {
      cancelled = true;
    };
  }, [retrySignal]);

  return (
    <main id="home" className="lehenga-page">
      <SiteHeader openSignal={menuOpenSignal} variant="overlay" />

      <section className="hero-section">
        <div
          className="hero-image-wrap"
          role="button"
          tabIndex={0}
          aria-label="Open menu"
          onClick={() => setMenuOpenSignal((prev) => prev + 1)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setMenuOpenSignal((prev) => prev + 1);
            }
          }}
        >
          <Image
            src={heroImage}
            alt="Bride wearing a luxury red lehenga"
            className="hero-image"
            priority
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Luxury Lehengas</h1>
          <p>Without the Lifetime Commitment.</p>
          <Link href="/shop-all" className="hero-button">
            Shop Now
          </Link>
        </div>
      </section>

      {loading ? <CatalogLoader label="Loading the latest collection" /> : null}
      {error ? <CatalogError message={error} onRetry={() => setRetrySignal((value) => value + 1)} /> : null}

      {!loading && !error ? (
        <ProductSection id="categories" title="Latest Drop" href="/shop-all" products={latestDrop} />
      ) : null}

      {!loading && !error ? categories.map((category, index) => (
        <ProductSection
          key={category.id}
          id={`category-${index}-${category.slug}`}
          title={category.name}
          href="/categories"
          products={getLatestSectionProducts(category.products)}
        />
      )) : null}

      <StorePromoBanner />
      <StoreFaqSection />

      <SiteFooter />
    </main>
  );
}

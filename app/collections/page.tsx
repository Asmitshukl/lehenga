"use client";

import { useEffect, useState } from "react";

import { StoreProductCard } from "@/app/_components/store-product-card";
import { fetchCollections } from "@/app/_lib/store-api";
import type { StoreCollection } from "@/app/_lib/store-types";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<StoreCollection[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      const data = await fetchCollections();

      if (!cancelled) {
        setCollections(data);
      }
    };

    void loadCollections();

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
          <span>Categories</span>
        </div>

        {collections.map((collection) => {
          const lehengaCount = collection.products.filter((product) => product.kind === "LEHENGA").length;
          const jewelleryCount = collection.products.filter((product) => product.kind === "JEWELLERY").length;

          return (
            <section key={collection.id} className="catalog-section">
              <div className="section-row">
                <div>
                  <h2>{collection.name}</h2>
                  <p>
                    {lehengaCount} lehengas · {jewelleryCount} jewellery
                    {collection.isFeatured ? " · Featured category" : ""}
                  </p>
                </div>
                <span>{collection.products.length} styles</span>
              </div>

              {collection.products.length > 0 ? (
                <div className="product-grid-shell">
                  <div className="product-grid">
                    {collection.products.map((product) => (
                      <StoreProductCard key={`${collection.id}-${product.kind}-${product.id}`} product={product} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="cart-empty-state">
                  <p>No lehengas or jewellery have been added to this category yet.</p>
                </div>
              )}
            </section>
          );
        })}

        {collections.length === 0 ? (
          <div className="cart-empty-state">
            <p>No categories are available right now.</p>
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}

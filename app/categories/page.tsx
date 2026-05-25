"use client";

import { useEffect, useState } from "react";

import { StoreBreadcrumb } from "@/app/_components/store-breadcrumb";
import { StoreProductCard } from "@/app/_components/store-product-card";
import { fetchCategories } from "@/app/_lib/store-api";
import type { StoreCategory } from "@/app/_lib/store-types";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      const data = await fetchCategories();

      if (!cancelled) {
        setCategories(data);
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="lehenga-page">
      <SiteHeader />
      <section className="shopall-section">
        <StoreBreadcrumb items={[{ label: "Home", href: "/#home" }, { label: "Collections" }]} />

        {categories.map((category) => {
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
        })}

        {categories.length === 0 ? (
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

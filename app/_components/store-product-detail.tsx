import Link from "next/link";

import { StoreBreadcrumb } from "./store-breadcrumb";
import { ProductGallery } from "./product-gallery";
import { ProductDetailActions } from "./product-detail-actions";
import { ProductReviewForm } from "./product-review-form";
import { StoreFaqSection, StorePromoBanner } from "./store-marketing-sections";
import { StoreProductCard } from "./store-product-card";
import type { StoreProduct } from "../_lib/store-types";

function formatCurrency(value?: number) {
  if (value === undefined) {
    return null;
  }

  return `RS ${value.toLocaleString("en-IN")}`;
}

function getProductSpecs(product: StoreProduct) {
  const specs: Array<{ label: string; value: string }> = [];

  if (product.categoryName) specs.push({ label: "Category", value: product.categoryName });
  if (product.designer) specs.push({ label: "Designer", value: product.designer });
  if (product.typeLabel) specs.push({ label: "Type", value: product.typeLabel.replaceAll("_", " ") });
  if (product.color) specs.push({ label: "Color", value: product.color });
  if (product.fabric) specs.push({ label: "Fabric", value: product.fabric });
  if (product.finish) specs.push({ label: "Finish", value: product.finish });
  if (product.stoneDetails) specs.push({ label: "Stone details", value: product.stoneDetails });
  if (product.occasion) specs.push({ label: "Occasion", value: product.occasion });
  if (product.minimumRentalDays) specs.push({ label: "Minimum rental", value: `${product.minimumRentalDays} day(s)` });
  if (product.securityDeposit !== undefined) specs.push({ label: "Security deposit", value: formatCurrency(product.securityDeposit) ?? "" });
  if (product.kind === "JEWELLERY" && product.stockQuantity !== undefined) {
    specs.push({ label: "Stock quantity", value: String(product.stockQuantity) });
  }

  return specs.filter((spec) => spec.value.trim().length > 0);
}

function getAverageRating(product: StoreProduct) {
  if (!product.reviews || product.reviews.length === 0) {
    return null;
  }

  const total = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / product.reviews.length;
}

function getAboutNarrative(product: StoreProduct) {
  return (
    product.description ??
    product.shortDescription ??
    `${product.name} is curated for statement occasions with a polished silhouette, detailed finish, and a rental-first fit for celebrations.`
  );
}

export function StoreProductDetail({
  product,
  listingHref,
  listingLabel,
  relatedLehengas = [],
  pairedJewellery = [],
}: {
  product: StoreProduct;
  listingHref: string;
  listingLabel: string;
  relatedLehengas?: StoreProduct[];
  pairedJewellery?: StoreProduct[];
}) {
  const specs = getProductSpecs(product);
  const aboutNarrative = getAboutNarrative(product);
  const averageRating = getAverageRating(product);

  return (
    <section className="product-detail-page">
      <div className="product-detail-content">
        <StoreBreadcrumb
          items={[
            { label: "Home", href: "/#home" },
            { label: listingLabel, href: listingHref },
            { label: product.name },
          ]}
        />

        <div className="product-detail-layout">
          <ProductGallery key={product.id} productId={product.id} productName={product.name} images={product.images} />

          <div className="product-detail-copy">
            <div className="product-detail-copy-inner">
              <h1>{product.name}</h1>
              {averageRating ? (
                <Link href="#product-reviews" className="product-detail-review-summary">
                  <strong>{averageRating.toFixed(1)} / 5</strong>
                  <span>{"★".repeat(Math.round(averageRating))}</span>
                  <small>
                    Based on {product.reviews?.length ?? 0} review{product.reviews?.length === 1 ? "" : "s"}.
                    Click to read all comments.
                  </small>
                </Link>
              ) : null}
              {product.shortDescription ? <p className="product-detail-summary">{product.shortDescription}</p> : null}
            </div>

            <ProductDetailActions product={product} />
          </div>
        </div>

        <section className="product-detail-about-card">
          <div className="product-detail-about-copy">
            <h2>About this item</h2>
            <p>{aboutNarrative}</p>
            {specs.length > 0 ? (
              <div className="product-detail-about-grid">
                <dl>
                  {specs.map((spec) => (
                    <div key={spec.label} className="product-detail-spec-row">
                      <dt>{spec.label}</dt>
                      <dd>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
                <button type="button" className="product-detail-view-more">
                  View more
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {product.kind === "LEHENGA" && relatedLehengas.length > 0 ? (
          <section className="product-detail-recommendation-section">
            <div className="section-row">
              <div>
                <h2>You may also like</h2>
                <p>More lehengas curated for a similar mood.</p>
              </div>
              <Link href="/shop-all" className="discover-button">
                View all lehengas
              </Link>
            </div>

            <div className="product-grid-shell">
              <div className="product-grid product-grid-detail">
                {relatedLehengas.map((relatedProduct) => (
                  <StoreProductCard
                    key={`related-${relatedProduct.kind}-${relatedProduct.id}`}
                    product={relatedProduct}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {product.kind === "LEHENGA" && pairedJewellery.length > 0 ? (
          <section className="product-detail-recommendation-section">
            <div className="section-row">
              <div>
                <h2>Pair it with</h2>
                <p>Jewellery picks that complement this lehenga.</p>
              </div>
              <Link href="/jewellery" className="discover-button">
                Browse jewellery
              </Link>
            </div>

            <div className="product-grid-shell">
              <div className="product-grid product-grid-detail">
                {pairedJewellery.map((jewelleryProduct) => (
                  <StoreProductCard
                    key={`paired-${jewelleryProduct.kind}-${jewelleryProduct.id}`}
                    product={jewelleryProduct}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <StorePromoBanner />
        <section id="product-reviews" className="product-detail-review-section">
          <ProductReviewForm product={product} reviews={product.reviews ?? []} />
        </section>
        <StoreFaqSection />
      </div>
    </section>
  );
}

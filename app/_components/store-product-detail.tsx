import Link from "next/link";

import { ProductDetailActions } from "./product-detail-actions";
import { StoreProductCard } from "./store-product-card";
import { StoreProductImage } from "./store-product-image";
import type { StoreProduct } from "../_lib/store-types";

function formatCurrency(value?: number) {
  if (value === undefined) {
    return null;
  }

  return `RS ${value.toLocaleString("en-IN")}`;
}

function getProductSpecs(product: StoreProduct) {
  const specs: Array<{ label: string; value: string }> = [];

  if (product.collectionName) specs.push({ label: "Category", value: product.collectionName });
  if (product.designer) specs.push({ label: "Designer", value: product.designer });
  if (product.typeLabel) specs.push({ label: "Type", value: product.typeLabel.replaceAll("_", " ") });
  if (product.color) specs.push({ label: "Color", value: product.color });
  if (product.fabric) specs.push({ label: "Fabric", value: product.fabric });
  if (product.material) specs.push({ label: "Material", value: product.material });
  if (product.finish) specs.push({ label: "Finish", value: product.finish });
  if (product.stoneDetails) specs.push({ label: "Stone details", value: product.stoneDetails });
  if (product.occasion) specs.push({ label: "Occasion", value: product.occasion });
  if (product.minimumRentalDays) specs.push({ label: "Minimum rental", value: `${product.minimumRentalDays} day(s)` });
  if (product.securityDeposit !== undefined) specs.push({ label: "Security deposit", value: formatCurrency(product.securityDeposit) ?? "" });
  if (product.originalPrice !== undefined) specs.push({ label: "Original price", value: formatCurrency(product.originalPrice) ?? "" });
  if (product.kind === "JEWELLERY" && product.stockQuantity !== undefined) {
    specs.push({ label: "Stock quantity", value: String(product.stockQuantity) });
  }

  return specs.filter((spec) => spec.value.trim().length > 0);
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
  const title = product.kind === "LEHENGA" ? "Lehenga" : "Jewellery";

  return (
    <section className="product-detail-page">
      <div className="product-detail-content">
        <div className="shopall-breadcrumb" aria-label="Breadcrumb">
            <Link href="/#home" className="breadcrumb-muted">
              Home
            </Link>
            <span className="breadcrumb-sep" aria-hidden="true">
              &gt;
            </span>
            <Link href={listingHref} className="breadcrumb-muted">
              {listingLabel}
            </Link>
            <span className="breadcrumb-sep" aria-hidden="true">
              &gt;
            </span>
            <span>{product.name}</span>
          </div>

          <div className="product-detail-layout">
            <div className="product-detail-gallery">
              <div className="product-detail-primary-image">
                <StoreProductImage image={product.image} name={product.name} className="product-detail-image" />
              </div>

              {product.images.length > 1 ? (
                <div className="product-detail-thumbnail-grid">
                  {product.images.slice(1).map((image, index) => (
                    <div key={`${product.id}-${index}`} className="product-detail-thumbnail">
                      <StoreProductImage
                        image={image.url}
                        name={image.altText ?? `${product.name} view ${index + 2}`}
                        className="product-detail-thumbnail-image"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="product-detail-copy">
              <p className="product-detail-kicker">{title}</p>
              <h1>{product.name}</h1>
              <p className="product-detail-price">RS {product.rentalPricePerDay.toLocaleString("en-IN")}/night</p>

              {product.shortDescription ? <p className="product-detail-summary">{product.shortDescription}</p> : null}
              {product.description ? <p className="product-detail-description">{product.description}</p> : null}

              <ProductDetailActions product={product} />

              {product.kind === "LEHENGA" && product.sizes.length > 0 ? (
                <div className="product-detail-size-list">
                  <h2>Available sizes</h2>
                  <div className="product-detail-chip-row">
                    {product.sizes.map((size) => (
                      <span key={size.id} className="product-detail-chip">
                        {size.sizeLabel} · {size.quantityAvailable} left
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {specs.length > 0 ? (
                <div className="product-detail-specs">
                  <h2>Product details</h2>
                  <dl>
                    {specs.map((spec) => (
                      <div key={spec.label} className="product-detail-spec-row">
                        <dt>{spec.label}</dt>
                        <dd>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>

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
        </div>
      </section>
  );
}

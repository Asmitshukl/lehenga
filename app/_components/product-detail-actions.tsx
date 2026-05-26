"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { useCart } from "./cart-provider";
import { saveBuyNowDraft } from "../_lib/checkout-draft";
import type { CartItem, StoreProduct } from "../_lib/store-types";

function formatSelectedDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function createDraftItem(product: StoreProduct, selectedSizeId?: string, measurements?: CartItem["measurements"], rentalStartDate?: string, rentalEndDate?: string): CartItem {
  const selectedSize = selectedSizeId
    ? product.sizes.find((size) => size.id === selectedSizeId) ?? product.sizes[0]
    : product.sizes[0];

  return {
    productId: product.id,
    kind: product.kind,
    slug: product.slug,
    name: product.name,
    image: product.image,
    rentalPricePerDay: product.rentalPricePerDay,
    securityDeposit: product.securityDeposit,
    quantity: 1,
    selectedSizeId: selectedSize?.id,
    selectedSizeLabel: selectedSize?.sizeLabel,
    availableSizes: product.sizes,
    rentalStartDate,
    rentalEndDate,
    measurements,
  };
}

export function ProductDetailActions({ product }: { product: StoreProduct }) {
  const { addItem } = useCart();
  const router = useRouter();
  const startDateInputRef = useRef<HTMLInputElement | null>(null);
  const endDateInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState(product.sizes[0]?.id ?? "");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState("");
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<CartItem["measurements"]>({
    upper: "",
    chest: "",
    waist: "",
    armHole: "",
    mori: "",
    notes: "",
  });

  const formattedStartDate = useMemo(() => formatSelectedDate(rentalStartDate), [rentalStartDate]);
  const formattedEndDate = useMemo(() => formatSelectedDate(rentalEndDate), [rentalEndDate]);

  const handleAddToCart = () => {
    addItem(product, selectedSizeId || undefined, {
      rentalStartDate,
      rentalEndDate,
      measurements: product.kind === "LEHENGA" ? measurements : undefined,
    });
  };

  const proceedToCheckout = (nextMeasurements?: CartItem["measurements"]) => {
    saveBuyNowDraft(
      createDraftItem(
        product,
        selectedSizeId || undefined,
        product.kind === "LEHENGA" ? nextMeasurements : undefined,
        rentalStartDate,
        rentalEndDate,
      ),
    );
    router.push("/checkout?mode=buy-now");
  };

  const handleBookNow = () => {
    if (product.kind === "LEHENGA") {
      setShowMeasurements(true);
      return;
    }

    proceedToCheckout();
  };

  return (
    <>
      <div className="product-detail-purchase">
        <div className="product-detail-date-block">
          <span>Select Dates:</span>
          <div className="product-detail-date-row">
            <button
              type="button"
              className="product-detail-date-card product-detail-date-button"
              onClick={() => startDateInputRef.current?.showPicker?.() ?? startDateInputRef.current?.click()}
            >
              <small>Start Date</small>
              <strong>{formattedStartDate ?? "Choose date"}</strong>
            </button>
            <div className="product-detail-date-separator">to</div>
            <button
              type="button"
              className={`product-detail-date-card product-detail-date-button${formattedEndDate ? "" : " is-placeholder"}`}
              onClick={() => endDateInputRef.current?.showPicker?.() ?? endDateInputRef.current?.click()}
            >
              {formattedEndDate ?? "Return Date"}
            </button>
          </div>
          <input
            ref={startDateInputRef}
            className="sr-only"
            type="date"
            value={rentalStartDate}
            onChange={(event) => setRentalStartDate(event.target.value)}
          />
          <input
            ref={endDateInputRef}
            className="sr-only"
            type="date"
            value={rentalEndDate}
            min={rentalStartDate || undefined}
            onChange={(event) => setRentalEndDate(event.target.value)}
          />
        </div>

        {product.kind === "LEHENGA" && product.sizes.length > 1 ? (
          <label className="product-detail-field">
            <span>Select size</span>
            <select value={selectedSizeId} onChange={(event) => setSelectedSizeId(event.target.value)}>
              {product.sizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.sizeLabel} · {size.quantityAvailable} available
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <p className="product-detail-availability">
          Status: <strong>{product.isMock ? "Preview" : "Available"}</strong>
        </p>
        <p className="product-detail-price-emphasis">
          Price: <strong>RS {product.rentalPricePerDay.toLocaleString("en-IN")}/night</strong>
        </p>
        {product.securityDeposit ? (
          <p className="product-detail-availability">
            Deposit: <strong>RS {product.securityDeposit.toLocaleString("en-IN")}</strong>
          </p>
        ) : null}

        <div className="product-detail-button-row">
          <button
            type="button"
            className="product-detail-secondary-button"
            onClick={handleAddToCart}
            disabled={product.isMock}
          >
            Add to Cart
          </button>
          <button
            type="button"
            className="product-detail-primary-button"
            onClick={handleBookNow}
            disabled={product.isMock}
          >
            Book Now
          </button>
        </div>
      </div>

      {showMeasurements ? (
        <div className="measurements-overlay" role="dialog" aria-modal="true" aria-labelledby="measurements-title">
          <div className="measurements-modal">
            <div className="measurements-modal-header">
              <h2 id="measurements-title">Measurements</h2>
              <button type="button" className="measurements-close" onClick={() => setShowMeasurements(false)}>
                ×
              </button>
            </div>

            <div className="measurements-form">
              {[
                { key: "upper", label: "Upper", placeholder: "in inches" },
                { key: "chest", label: "Chest", placeholder: "in inches" },
                { key: "waist", label: "Waist", placeholder: "in inches" },
                { key: "armHole", label: "Arm hole", placeholder: "in inches" },
                { key: "mori", label: "Mori", placeholder: "in inches" },
              ].map((field) => (
                <label key={field.key} className="product-detail-field">
                  <span>{field.label}</span>
                  <input
                    value={(measurements?.[field.key as keyof NonNullable<CartItem["measurements"]>] as string) ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      setMeasurements((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}

              <label className="product-detail-field">
                <span>Others</span>
                <textarea
                  rows={3}
                  value={measurements?.notes ?? ""}
                  placeholder="Write additional info"
                  onChange={(event) =>
                    setMeasurements((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <button
                type="button"
                className="product-detail-primary-button is-compact"
                onClick={() => {
                  setShowMeasurements(false);
                  proceedToCheckout(measurements);
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

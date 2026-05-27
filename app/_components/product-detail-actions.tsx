"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { useCart } from "./cart-provider";
import { LehengaDetailsDialog } from "./lehenga-details-dialog";
import { getRemainingInventory, isProductOutOfStock } from "../_lib/product-inventory";
import { saveBuyNowDraft } from "../_lib/checkout-draft";
import type { CartItem, StoreProduct } from "../_lib/store-types";

type LehengaActionMode = "cart" | "buy-now" | null;
const JEWELLERY_DETAIL_SIZE_ID = "__jewellery__";

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

function hasInvalidDateRange(rentalStartDate?: string, rentalEndDate?: string) {
  if (!rentalStartDate || !rentalEndDate) {
    return false;
  }

  return new Date(rentalEndDate) < new Date(rentalStartDate);
}

function createDraftItem(
  product: StoreProduct,
  selectedSizeId?: string,
  measurements?: CartItem["measurements"],
  rentalStartDate?: string,
  rentalEndDate?: string,
): CartItem {
  const selectedSize =
    selectedSizeId
      ? product.sizes.find((size) => size.id === selectedSizeId) ?? product.sizes[0]
      : product.sizes[0];
  const fallbackSelection =
    product.kind === "JEWELLERY" && !selectedSize
      ? {
          id: JEWELLERY_DETAIL_SIZE_ID,
          sizeLabel: "Jewellery",
        }
      : undefined;

  return {
    cartLineId: `${product.kind}:${product.id}:${selectedSize?.id ?? fallbackSelection?.id ?? "default"}:buy-now`,
    productId: product.id,
    kind: product.kind,
    slug: product.slug,
    name: product.name,
    image: product.image,
    rentalPricePerDay: product.rentalPricePerDay,
    securityDeposit: product.securityDeposit,
    quantity: 1,
    selectedSizeId: selectedSize?.id ?? fallbackSelection?.id,
    selectedSizeLabel: selectedSize?.sizeLabel ?? fallbackSelection?.sizeLabel,
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
  const [lehengaActionMode, setLehengaActionMode] = useState<LehengaActionMode>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
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
  const remainingInventory = getRemainingInventory(product);
  const isOutOfStock = isProductOutOfStock(product);

  const validateJewelleryDates = () => {
    if (!rentalStartDate || !rentalEndDate) {
      setActionSuccess(null);
      setActionError("Please select pickup and return dates for this jewellery item.");
      return false;
    }

    if (hasInvalidDateRange(rentalStartDate, rentalEndDate)) {
      setActionSuccess(null);
      setActionError("Return date must be after the pickup date.");
      return false;
    }

    return true;
  };

  const handleAddToCart = (nextMeasurements?: CartItem["measurements"]) => {
    if (isOutOfStock) {
      setActionSuccess(null);
      setActionError(`${product.name} is currently out of stock.`);
      return;
    }

    if (product.kind === "JEWELLERY" && !validateJewelleryDates()) {
      return;
    }

    addItem(product, selectedSizeId || undefined, {
      rentalStartDate,
      rentalEndDate,
      measurements: product.kind === "LEHENGA" ? nextMeasurements : undefined,
    });
    setActionError(null);
    setActionSuccess(`${product.name} was added to your cart.`);
  };

  const proceedToCheckout = (nextMeasurements?: CartItem["measurements"]) => {
    if (isOutOfStock) {
      setActionSuccess(null);
      setActionError(`${product.name} is currently out of stock.`);
      return;
    }

    if (product.kind === "JEWELLERY" && !validateJewelleryDates()) {
      return;
    }

    saveBuyNowDraft(
      createDraftItem(
        product,
        selectedSizeId || undefined,
        product.kind === "LEHENGA" ? nextMeasurements : undefined,
        rentalStartDate,
        rentalEndDate,
      ),
    );
    setActionError(null);
    setActionSuccess(null);
    router.push("/checkout?mode=buy-now");
    window.setTimeout(() => {
      if (window.location.pathname !== "/checkout") {
        window.location.assign("/checkout?mode=buy-now");
      }
    }, 150);
  };

  const openLehengaDetails = (mode: Exclude<LehengaActionMode, null>) => {
    setActionSuccess(null);
    setActionError(null);
    setLehengaActionMode(mode);
  };

  const handleBookNow = () => {
    if (product.kind === "LEHENGA") {
      openLehengaDetails("buy-now");
      return;
    }

    proceedToCheckout();
  };

  if (product.kind === "JEWELLERY") {
    return (
      <JewelleryDetailActions
        product={product}
        onAddToCart={() => handleAddToCart()}
        onBookNow={handleBookNow}
        rentalStartDate={rentalStartDate}
        rentalEndDate={rentalEndDate}
        formattedStartDate={formattedStartDate}
        formattedEndDate={formattedEndDate}
        startDateInputRef={startDateInputRef}
        endDateInputRef={endDateInputRef}
        setRentalStartDate={setRentalStartDate}
        setRentalEndDate={setRentalEndDate}
        actionError={actionError}
        actionSuccess={actionSuccess}
        setActionError={setActionError}
        setActionSuccess={setActionSuccess}
        remainingInventory={remainingInventory}
        isOutOfStock={isOutOfStock}
      />
    );
  }

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
            onChange={(event) => {
              setRentalStartDate(event.target.value);
              setActionError(null);
              setActionSuccess(null);
            }}
          />
          <input
            ref={endDateInputRef}
            className="sr-only"
            type="date"
            value={rentalEndDate}
            min={rentalStartDate || undefined}
            onChange={(event) => {
              setRentalEndDate(event.target.value);
              setActionError(null);
              setActionSuccess(null);
            }}
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
          Status: <strong>{product.isMock ? "Preview" : isOutOfStock ? "Out of stock" : "Available"}</strong>
        </p>
        <p className="product-detail-availability">
          Remaining: <strong>{remainingInventory}</strong>
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
            onClick={() => {
              if (product.kind === "LEHENGA") {
                openLehengaDetails("cart");
                return;
              }

              handleAddToCart();
            }}
            disabled={product.isMock || isOutOfStock}
          >
            Add to Cart
          </button>
          <button
            type="button"
            className="product-detail-primary-button"
            onClick={handleBookNow}
            disabled={product.isMock || isOutOfStock}
          >
            Book Now
          </button>
        </div>
        {actionError ? <p className="cart-feedback cart-feedback-error">{actionError}</p> : null}
        {actionSuccess ? <p className="cart-feedback cart-feedback-success">{actionSuccess}</p> : null}
      </div>

      {lehengaActionMode !== null ? (
        <LehengaDetailsDialog
          key={`${product.id}-${lehengaActionMode}`}
          productName={product.name}
          initialMeasurements={measurements}
          submitLabel={lehengaActionMode === "cart" ? "Save details and add to cart" : "Save details and continue"}
          onClose={() => setLehengaActionMode(null)}
          onSubmit={(nextMeasurements) => {
            setMeasurements(nextMeasurements);
            setLehengaActionMode(null);

            if (lehengaActionMode === "cart") {
              handleAddToCart(nextMeasurements);
              return;
            }

            proceedToCheckout(nextMeasurements);
          }}
        />
      ) : null}
    </>
  );
}

function JewelleryDetailActions({
  product,
  onAddToCart,
  onBookNow,
  rentalStartDate,
  rentalEndDate,
  formattedStartDate,
  formattedEndDate,
  startDateInputRef,
  endDateInputRef,
  setRentalStartDate,
  setRentalEndDate,
  actionError,
  actionSuccess,
  setActionError,
  setActionSuccess,
  remainingInventory,
  isOutOfStock,
}: {
  product: StoreProduct;
  onAddToCart: () => void;
  onBookNow: () => void;
  rentalStartDate: string;
  rentalEndDate: string;
  formattedStartDate: string | null;
  formattedEndDate: string | null;
  startDateInputRef: RefObject<HTMLInputElement | null>;
  endDateInputRef: RefObject<HTMLInputElement | null>;
  setRentalStartDate: Dispatch<SetStateAction<string>>;
  setRentalEndDate: Dispatch<SetStateAction<string>>;
  actionError: string | null;
  actionSuccess: string | null;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setActionSuccess: Dispatch<SetStateAction<string | null>>;
  remainingInventory: number;
  isOutOfStock: boolean;
}) {
  const handleJewelleryAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    onAddToCart();
  };

  const handleJewelleryBookNow = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    onBookNow();
  };

  return (
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
          onChange={(event) => {
            const nextStartDate = event.target.value;
            setRentalStartDate(nextStartDate);
            if (hasInvalidDateRange(nextStartDate, rentalEndDate)) {
              setRentalEndDate("");
            }
            setActionError(null);
            setActionSuccess(null);
          }}
        />
        <input
          ref={endDateInputRef}
          className="sr-only"
          type="date"
          value={rentalEndDate}
          min={rentalStartDate || undefined}
          onChange={(event) => {
            setRentalEndDate(event.target.value);
            setActionError(null);
            setActionSuccess(null);
          }}
        />
      </div>

      <p className="product-detail-availability">
        Status: <strong>{product.isMock ? "Preview" : isOutOfStock ? "Out of stock" : "Available"}</strong>
      </p>
      <p className="product-detail-availability">
        Remaining: <strong>{remainingInventory}</strong>
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
          onClick={handleJewelleryAddToCart}
          disabled={product.isMock || isOutOfStock}
        >
          Add to Cart
        </button>
        <button
          type="button"
          className="product-detail-primary-button"
          onClick={handleJewelleryBookNow}
          disabled={product.isMock || isOutOfStock}
        >
          Book Now
        </button>
      </div>
      {actionError ? <p className="cart-feedback cart-feedback-error">{actionError}</p> : null}
      {actionSuccess ? <p className="cart-feedback cart-feedback-success">{actionSuccess}</p> : null}
    </div>
  );
}

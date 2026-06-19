"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";

import { useCart } from "./cart-provider";
import { LehengaDetailsDialog } from "./lehenga-details-dialog";
import { getRemainingInventory, isProductOutOfStock } from "../_lib/product-inventory";
import { saveBuyNowDraft } from "../_lib/checkout-draft";
import { fetchProductAvailability } from "../_lib/store-api";
import type { CartItem, StoreProduct } from "../_lib/store-types";

type LehengaActionMode = "cart" | "buy-now" | null;
const CART_STORAGE_KEY = "lehenga-cart";
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
    sku: product.sku,
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

function createJewelleryCartItem(
  product: StoreProduct,
  rentalStartDate?: string,
  rentalEndDate?: string,
): CartItem {
  return {
    cartLineId: `JEWELLERY:${product.id}:${JEWELLERY_DETAIL_SIZE_ID}:${Date.now()}`,
    productId: product.id,
    kind: "JEWELLERY",
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    image: product.image,
    rentalPricePerDay: product.rentalPricePerDay,
    securityDeposit: product.securityDeposit,
    quantity: 1,
    selectedSizeId: JEWELLERY_DETAIL_SIZE_ID,
    selectedSizeLabel: "Jewellery",
    availableSizes: [],
    rentalStartDate,
    rentalEndDate,
  };
}

function readCartItems() {
  if (typeof window === "undefined") {
    return [];
  }

  const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

  if (!rawCart) {
    return [];
  }

  try {
    const parsedCart = JSON.parse(rawCart);
    return Array.isArray(parsedCart) ? (parsedCart as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveJewelleryToCart(product: StoreProduct, rentalStartDate?: string, rentalEndDate?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const currentCart = readCartItems();
  const existingIndex = currentCart.findIndex(
    (item) =>
      item.kind === "JEWELLERY" &&
      item.productId === product.id &&
      item.selectedSizeId === JEWELLERY_DETAIL_SIZE_ID,
  );

  const nextCart =
    existingIndex >= 0
      ? currentCart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
                rentalStartDate: rentalStartDate || item.rentalStartDate,
                rentalEndDate: rentalEndDate || item.rentalEndDate,
              }
            : item,
        )
      : [...currentCart, createJewelleryCartItem(product, rentalStartDate, rentalEndDate)];

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));

  try {
    window.dispatchEvent(new StorageEvent("storage", { key: CART_STORAGE_KEY }));
  } catch {
    window.dispatchEvent(new Event("storage"));
  }
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
  const [dateAvailability, setDateAvailability] = useState<{ available: boolean; quantityAvailable: number } | null>(null);
  const jewelleryActionLockRef = useRef<"cart" | "checkout" | null>(null);
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
  const unavailableForDates = Boolean(dateAvailability && !dateAvailability.available);
  const checkingAvailability =
    Boolean(rentalStartDate && rentalEndDate) &&
    !hasInvalidDateRange(rentalStartDate, rentalEndDate) &&
    dateAvailability === null &&
    actionError === null;

  useEffect(() => {
    if (!rentalStartDate || !rentalEndDate || hasInvalidDateRange(rentalStartDate, rentalEndDate)) {
      return;
    }

    let cancelled = false;

    void fetchProductAvailability({
      itemType: product.kind,
      productId: product.id,
      sizeId: product.kind === "LEHENGA" ? selectedSizeId : undefined,
      startDate: rentalStartDate,
      endDate: rentalEndDate,
    })
      .then((result) => {
        if (!cancelled) {
          setDateAvailability(result);
        }
      })
      .catch((availabilityError) => {
        if (!cancelled) {
          setDateAvailability(null);
          setActionError(
            availabilityError instanceof Error ? availabilityError.message : "Could not check availability.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [product.id, product.kind, rentalEndDate, rentalStartDate, selectedSizeId]);

  const validateSelectedDateRange = () => {
    if (hasInvalidDateRange(rentalStartDate, rentalEndDate)) {
      setActionSuccess(null);
      setActionError("Return date must be after the pickup date.");
      return false;
    }

    return true;
  };

  const handleAddToCart = (nextMeasurements?: CartItem["measurements"]) => {
    if (isOutOfStock || unavailableForDates) {
      setActionSuccess(null);
      setActionError(`${product.name} is currently out of stock.`);
      return;
    }

    if (product.kind === "JEWELLERY" && !validateSelectedDateRange()) {
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
    if (isOutOfStock || unavailableForDates) {
      setActionSuccess(null);
      setActionError(`${product.name} is currently out of stock.`);
      return;
    }

    if (product.kind === "JEWELLERY" && !validateSelectedDateRange()) {
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

  const handleJewelleryAddToCart = () => {
    if (jewelleryActionLockRef.current) {
      return;
    }

    if (isOutOfStock || unavailableForDates) {
      setActionSuccess(null);
      setActionError(`${product.name} is currently out of stock.`);
      return;
    }

    if (!validateSelectedDateRange()) {
      return;
    }

    jewelleryActionLockRef.current = "cart";
    saveJewelleryToCart(product, rentalStartDate, rentalEndDate);
    setActionError(null);
    setActionSuccess(`${product.name} was added to your cart.`);
    window.location.assign("/cart");
  };

  const handleJewelleryBookNow = () => {
    if (jewelleryActionLockRef.current) {
      return;
    }

    if (isOutOfStock || unavailableForDates) {
      setActionSuccess(null);
      setActionError(`${product.name} is currently out of stock.`);
      return;
    }

    if (!validateSelectedDateRange()) {
      return;
    }

    jewelleryActionLockRef.current = "checkout";
    saveBuyNowDraft(createJewelleryCartItem(product, rentalStartDate, rentalEndDate));
    setActionError(null);
    setActionSuccess(null);
    window.location.assign("/checkout?mode=buy-now");
  };

  if (product.kind === "JEWELLERY") {
    return (
      <JewelleryDetailActions
        product={product}
        onAddToCart={handleJewelleryAddToCart}
        onBookNow={handleJewelleryBookNow}
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
        dateAvailability={dateAvailability}
        checkingAvailability={checkingAvailability}
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
              setDateAvailability(null);
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
              setDateAvailability(null);
              setActionError(null);
              setActionSuccess(null);
            }}
          />
        </div>

        {product.kind === "LEHENGA" && product.sizes.length > 1 ? (
          <label className="product-detail-field">
            <span>Select size</span>
            <select
              value={selectedSizeId}
              onChange={(event) => {
                setSelectedSizeId(event.target.value);
                setDateAvailability(null);
              }}
            >
              {product.sizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.sizeLabel} · {size.quantityAvailable} available
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <p className="product-detail-availability">
          Status:{" "}
          <strong>
            {product.isMock
              ? "Preview"
              : checkingAvailability
                ? "Checking selected dates..."
                : unavailableForDates
                  ? "Unavailable for selected dates"
                  : dateAvailability
                    ? "Available for selected dates"
                    : isOutOfStock
                      ? "Out of stock"
                      : "Select dates to confirm"}
          </strong>
        </p>
        <p className="product-detail-availability">
          Remaining: <strong>{dateAvailability?.quantityAvailable ?? remainingInventory}</strong>
        </p>
        <p className="product-detail-price-emphasis">
          Price: <strong>RS {product.rentalPricePerDay.toLocaleString("en-IN")}/night</strong>
          {product.discountPercent && product.discountPercent > 0 ? (
            <span className="product-discount-badge">{product.discountPercent}% off</span>
          ) : null}
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
            disabled={product.isMock || isOutOfStock || unavailableForDates || checkingAvailability}
          >
            Add to Cart
          </button>
          <button
            type="button"
            className="product-detail-primary-button"
            onClick={handleBookNow}
            disabled={product.isMock || isOutOfStock || unavailableForDates || checkingAvailability}
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
  dateAvailability,
  checkingAvailability,
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
  dateAvailability: { available: boolean; quantityAvailable: number } | null;
  checkingAvailability: boolean;
}) {
  const handleJewelleryAddToCart = (event?: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    onAddToCart();
  };

  const handleJewelleryBookNow = (event?: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
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
        Status:{" "}
        <strong>
          {product.isMock
            ? "Preview"
            : checkingAvailability
              ? "Checking selected dates..."
              : dateAvailability && !dateAvailability.available
                ? "Unavailable for selected dates"
                : dateAvailability
                  ? "Available for selected dates"
                  : isOutOfStock
                    ? "Out of stock"
                    : "Select dates to confirm"}
        </strong>
      </p>
      <p className="product-detail-availability">
        Remaining: <strong>{dateAvailability?.quantityAvailable ?? remainingInventory}</strong>
      </p>
      <p className="product-detail-price-emphasis">
        Price: <strong>RS {product.rentalPricePerDay.toLocaleString("en-IN")}/night</strong>
        {product.discountPercent && product.discountPercent > 0 ? (
          <span className="product-discount-badge">{product.discountPercent}% off</span>
        ) : null}
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
          onPointerDown={handleJewelleryAddToCart}
          onClick={handleJewelleryAddToCart}
          disabled={product.isMock || isOutOfStock || dateAvailability?.available === false || checkingAvailability}
        >
          Add to Cart
        </button>
        <button
          type="button"
          className="product-detail-primary-button"
          onPointerDown={handleJewelleryBookNow}
          onClick={handleJewelleryBookNow}
          disabled={product.isMock || isOutOfStock || dateAvailability?.available === false || checkingAvailability}
        >
          Book Now
        </button>
      </div>
      {actionError ? <p className="cart-feedback cart-feedback-error">{actionError}</p> : null}
      {actionSuccess ? <p className="cart-feedback cart-feedback-success">{actionSuccess}</p> : null}
    </div>
  );
}

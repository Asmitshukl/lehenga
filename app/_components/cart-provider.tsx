"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

import type { CartItem, StoreProduct } from "../_lib/store-types";

const CART_STORAGE_KEY = "lehenga-cart";
const JEWELLERY_CART_LINE_ID = "__jewellery__";
const cartListeners = new Set<() => void>();
const EMPTY_CART: CartItem[] = [];
let lastCartStorageValue: string | null = null;
let lastCartSnapshot: CartItem[] = EMPTY_CART;

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (
    product: StoreProduct,
    selectedSizeId?: string,
    options?: {
      rentalStartDate?: string;
      rentalEndDate?: string;
      measurements?: CartItem["measurements"];
    },
  ) => void;
  removeItem: (cartLineId: string) => void;
  updateQuantity: (cartLineId: string, quantity: number) => void;
  updateSize: (cartLineId: string, selectedSizeId: string) => void;
  updateDates: (cartLineId: string, rentalStartDate?: string, rentalEndDate?: string) => void;
  updateMeasurements: (cartLineId: string, measurements?: CartItem["measurements"]) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isValidKind(value: unknown): value is CartItem["kind"] {
  return value === "LEHENGA" || value === "JEWELLERY";
}

function getDefaultSize(product: StoreProduct) {
  return product.sizes[0];
}

function getCartLineSizeId(product: StoreProduct, selectedSizeId?: string) {
  const defaultSize = selectedSizeId
    ? product.sizes.find((size) => size.id === selectedSizeId) ?? getDefaultSize(product)
    : getDefaultSize(product);

  if (defaultSize?.id) {
    return {
      selectedSizeId: defaultSize.id,
      selectedSizeLabel: defaultSize.sizeLabel,
    };
  }

  if (product.kind === "JEWELLERY") {
    return {
      selectedSizeId: JEWELLERY_CART_LINE_ID,
      selectedSizeLabel: "Jewellery",
    };
  }

  return {
    selectedSizeId: undefined,
    selectedSizeLabel: undefined,
  };
}

function isSameCartLine(item: CartItem, cartLineId: string) {
  return item.cartLineId === cartLineId;
}

function createCartLineId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cart-line-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readInitialCart() {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  const stored = window.localStorage.getItem(CART_STORAGE_KEY);

  if (!stored) {
    return EMPTY_CART;
  }

  try {
    const parsed = JSON.parse(stored) as Array<Partial<CartItem>>;
    const normalizedItems: CartItem[] = [];

    for (const [index, item] of parsed.entries()) {
      if (
        typeof item.productId !== "string" ||
        typeof item.slug !== "string" ||
        typeof item.name !== "string" ||
        typeof item.rentalPricePerDay !== "number" ||
        typeof item.quantity !== "number" ||
        !Array.isArray(item.availableSizes)
      ) {
        continue;
      }

      normalizedItems.push({
        cartLineId:
          typeof item.cartLineId === "string" && item.cartLineId.length > 0
            ? item.cartLineId
            : `${isValidKind(item.kind) ? item.kind : "LEHENGA"}:${item.productId}:${item.selectedSizeId ?? "default"}:${index}`,
        productId: item.productId,
        kind: isValidKind(item.kind) ? item.kind : "LEHENGA",
        slug: item.slug,
        name: item.name,
        image: item.image ?? "",
        rentalPricePerDay: item.rentalPricePerDay,
        securityDeposit: typeof item.securityDeposit === "number" ? item.securityDeposit : undefined,
        quantity: Math.max(1, item.quantity),
        availableSizes: item.availableSizes,
        ...(typeof item.selectedSizeId === "string" ? { selectedSizeId: item.selectedSizeId } : {}),
        ...(typeof item.selectedSizeLabel === "string"
          ? {
              selectedSizeLabel: item.selectedSizeLabel,
            }
          : {}),
        ...(typeof item.rentalStartDate === "string" ? { rentalStartDate: item.rentalStartDate } : {}),
        ...(typeof item.rentalEndDate === "string" ? { rentalEndDate: item.rentalEndDate } : {}),
        ...(item.measurements && typeof item.measurements === "object" ? { measurements: item.measurements } : {}),
        ...(item.isMock === true ? { isMock: true } : {}),
      });
    }

    return normalizedItems;
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return EMPTY_CART;
  }
}

function emitCartChange() {
  cartListeners.forEach((listener) => listener());
}

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getCartSnapshot() {
  const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);

  if (storedValue === lastCartStorageValue) {
    return lastCartSnapshot;
  }

  lastCartStorageValue = storedValue;
  lastCartSnapshot = readInitialCart();
  return lastCartSnapshot;
}

function getCartServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function writeCart(items: CartItem[]) {
  const serializedItems = JSON.stringify(items);
  window.localStorage.setItem(CART_STORAGE_KEY, serializedItems);
  lastCartStorageValue = serializedItems;
  lastCartSnapshot = items;
  emitCartChange();
}

function updateStoredCart(updater: (current: CartItem[]) => CartItem[]) {
  const currentItems = readInitialCart();
  const nextItems = updater(currentItems);
  writeCart(nextItems);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, getCartServerSnapshot);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem: (product, selectedSizeId, options) => {
        if (product.isMock) {
          return;
        }

        const cartLineSelection = getCartLineSizeId(product, selectedSizeId);

        updateStoredCart((current) => {
          const existingIndex =
            product.kind === "JEWELLERY"
              ? current.findIndex(
                  (item) =>
                    item.productId === product.id &&
                    item.kind === product.kind &&
                    item.selectedSizeId === cartLineSelection.selectedSizeId,
                )
              : -1;

          if (existingIndex >= 0) {
            return current.map((item, index) =>
              index === existingIndex
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    rentalStartDate: options?.rentalStartDate ?? item.rentalStartDate,
                    rentalEndDate: options?.rentalEndDate ?? item.rentalEndDate,
                    measurements: options?.measurements ?? item.measurements,
                  }
                : item,
            );
          }

          return [
            ...current,
            {
              productId: product.id,
              kind: product.kind,
              slug: product.slug,
              name: product.name,
              image: product.image,
              rentalPricePerDay: product.rentalPricePerDay,
              securityDeposit: product.securityDeposit,
              quantity: 1,
              cartLineId: createCartLineId(),
              selectedSizeId: cartLineSelection.selectedSizeId,
              selectedSizeLabel: cartLineSelection.selectedSizeLabel,
              availableSizes: product.sizes,
              rentalStartDate: options?.rentalStartDate,
              rentalEndDate: options?.rentalEndDate,
              measurements: options?.measurements,
            },
          ];
        });
      },
      removeItem: (cartLineId) => {
        updateStoredCart((current) => current.filter((item) => !isSameCartLine(item, cartLineId)));
      },
      updateQuantity: (cartLineId, quantity) => {
        if (quantity <= 0) {
          updateStoredCart((current) => current.filter((item) => !isSameCartLine(item, cartLineId)));
          return;
        }

        updateStoredCart((current) =>
          current.map((item) => (isSameCartLine(item, cartLineId) ? { ...item, quantity } : item)),
        );
      },
      updateSize: (cartLineId, selectedSizeId) => {
        updateStoredCart((current) =>
          current.map((item) => {
            if (!isSameCartLine(item, cartLineId)) {
              return item;
            }

            const nextSize = item.availableSizes.find((size) => size.id === selectedSizeId);

            return {
              ...item,
              selectedSizeId,
              selectedSizeLabel: nextSize?.sizeLabel,
            };
          }),
        );
      },
      updateDates: (cartLineId, rentalStartDate, rentalEndDate) => {
        updateStoredCart((current) =>
          current.map((item) => (isSameCartLine(item, cartLineId) ? { ...item, rentalStartDate, rentalEndDate } : item)),
        );
      },
      updateMeasurements: (cartLineId, measurements) => {
        updateStoredCart((current) =>
          current.map((item) => (isSameCartLine(item, cartLineId) ? { ...item, measurements } : item)),
        );
      },
      clearCart: () => writeCart([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}

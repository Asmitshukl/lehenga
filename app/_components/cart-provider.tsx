"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

import type { CartItem, StoreProduct } from "../_lib/store-types";

const CART_STORAGE_KEY = "lehenga-cart";
const cartListeners = new Set<() => void>();
const EMPTY_CART: CartItem[] = [];
let lastCartStorageValue: string | null = null;
let lastCartSnapshot: CartItem[] = EMPTY_CART;

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (product: StoreProduct, selectedSizeId?: string) => void;
  removeItem: (productId: string, kind: CartItem["kind"], selectedSizeId?: string) => void;
  updateQuantity: (
    productId: string,
    kind: CartItem["kind"],
    quantity: number,
    selectedSizeId?: string,
  ) => void;
  updateSize: (
    productId: string,
    kind: CartItem["kind"],
    previousSizeId: string | undefined,
    selectedSizeId: string,
  ) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isValidKind(value: unknown): value is CartItem["kind"] {
  return value === "LEHENGA" || value === "JEWELLERY";
}

function getDefaultSize(product: StoreProduct) {
  return product.sizes[0];
}

function isSameCartLine(item: CartItem, productId: string, kind: CartItem["kind"], selectedSizeId?: string) {
  return item.productId === productId && item.kind === kind && item.selectedSizeId === selectedSizeId;
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

    for (const item of parsed) {
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
        productId: item.productId,
        kind: isValidKind(item.kind) ? item.kind : "LEHENGA",
        slug: item.slug,
        name: item.name,
        image: item.image ?? "",
        rentalPricePerDay: item.rentalPricePerDay,
        quantity: Math.max(1, item.quantity),
        availableSizes: item.availableSizes,
        ...(typeof item.selectedSizeId === "string" ? { selectedSizeId: item.selectedSizeId } : {}),
        ...(typeof item.selectedSizeLabel === "string"
          ? {
              selectedSizeLabel: item.selectedSizeLabel,
            }
          : {}),
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
      addItem: (product, selectedSizeId) => {
        if (product.isMock) {
          return;
        }

        const defaultSize = selectedSizeId
          ? product.sizes.find((size) => size.id === selectedSizeId) ?? getDefaultSize(product)
          : getDefaultSize(product);

        updateStoredCart((current) => {
          const existingIndex = current.findIndex((item) =>
            isSameCartLine(item, product.id, product.kind, defaultSize?.id),
          );

          if (existingIndex >= 0) {
            return current.map((item, index) =>
              index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
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
              quantity: 1,
              selectedSizeId: defaultSize?.id,
              selectedSizeLabel: defaultSize?.sizeLabel,
              availableSizes: product.sizes,
            },
          ];
        });
      },
      removeItem: (productId, kind, selectedSizeId) => {
        updateStoredCart((current) =>
          current.filter((item) => !isSameCartLine(item, productId, kind, selectedSizeId)),
        );
      },
      updateQuantity: (productId, kind, quantity, selectedSizeId) => {
        if (quantity <= 0) {
          updateStoredCart((current) =>
            current.filter((item) => !isSameCartLine(item, productId, kind, selectedSizeId)),
          );
          return;
        }

        updateStoredCart((current) =>
          current.map((item) =>
            isSameCartLine(item, productId, kind, selectedSizeId) ? { ...item, quantity } : item,
          ),
        );
      },
      updateSize: (productId, kind, previousSizeId, selectedSizeId) => {
        updateStoredCart((current) =>
          current.map((item) => {
            if (!isSameCartLine(item, productId, kind, previousSizeId)) {
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

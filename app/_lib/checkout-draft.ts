"use client";

import type { CartItem } from "./store-types";

const BUY_NOW_STORAGE_KEY = "lehenga-buy-now-draft";

export function saveBuyNowDraft(item: CartItem) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(item));
}

export function readBuyNowDraft(): CartItem | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(BUY_NOW_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CartItem;
  } catch {
    window.localStorage.removeItem(BUY_NOW_STORAGE_KEY);
    return null;
  }
}

export function clearBuyNowDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(BUY_NOW_STORAGE_KEY);
}

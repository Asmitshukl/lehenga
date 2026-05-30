"use client";

import type { StoreOrder } from "./store-types";

const PAYMENT_ATTEMPTS_STORAGE_KEY = "lehenga-online-payment-attempts";
const FINAL_PAYMENT_STATUSES = new Set(["PAID", "CAPTURED", "COMPLETED", "SUCCESS"]);

type PaymentAttemptStatus = "initiated" | "verified" | "abandoned";

type StoredPaymentAttempt = {
  orderId: string;
  orderNumber: string;
  paymentStatus: PaymentAttemptStatus;
  createdAt: string;
};

type StoredPaymentAttemptMap = Record<string, StoredPaymentAttempt>;

function canUseStorage() {
  return typeof window !== "undefined";
}

function readStoredAttempts(): StoredPaymentAttemptMap {
  if (!canUseStorage()) {
    return {};
  }

  const raw = window.localStorage.getItem(PAYMENT_ATTEMPTS_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as StoredPaymentAttemptMap;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(PAYMENT_ATTEMPTS_STORAGE_KEY);
    return {};
  }
}

function writeStoredAttempts(attempts: StoredPaymentAttemptMap) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PAYMENT_ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
}

function updateStoredAttempts(updater: (current: StoredPaymentAttemptMap) => StoredPaymentAttemptMap) {
  writeStoredAttempts(updater(readStoredAttempts()));
}

function isFinalOnlinePaymentStatus(paymentStatus?: string | null) {
  if (!paymentStatus) {
    return false;
  }

  return FINAL_PAYMENT_STATUSES.has(paymentStatus.toUpperCase());
}

export function markOnlinePaymentInitiated(order: Pick<StoreOrder, "id" | "orderNumber">) {
  updateStoredAttempts((current) => ({
    ...current,
    [order.id]: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: "initiated",
      createdAt: new Date().toISOString(),
    },
  }));
}

export function markOnlinePaymentVerified(orderId: string) {
  updateStoredAttempts((current) => {
    if (!current[orderId]) {
      return current;
    }

    const next = { ...current };
    delete next[orderId];
    return next;
  });
}

export function markOnlinePaymentAbandoned(order: Pick<StoreOrder, "id" | "orderNumber">) {
  updateStoredAttempts((current) => {
    const existing = current[order.id];

    return {
      ...current,
      [order.id]: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: "abandoned",
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      },
    };
  });
}

export function filterVisibleOrders(orders: StoreOrder[]) {
  const attempts = readStoredAttempts();

  return orders.filter((order) => {
    if (order.paymentMethod !== "ONLINE") {
      return true;
    }

    if (isFinalOnlinePaymentStatus(order.paymentStatus)) {
      markOnlinePaymentVerified(order.id);
      return true;
    }

    const attempt = attempts[order.id];

    if (!attempt) {
      return true;
    }

    return attempt.paymentStatus !== "abandoned";
  });
}

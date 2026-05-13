"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { fetchCustomerProfile } from "../_lib/store-api";
import type { CustomerProfile } from "../_lib/store-types";

const CUSTOMER_TOKEN_KEY = "lehenga-customer-token";
const customerAuthListeners = new Set<() => void>();

type CustomerAuthContextValue = {
  customer: CustomerProfile | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (nextCustomer: CustomerProfile, nextToken: string) => void;
  logout: () => void;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

function readStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

function emitCustomerAuthChange() {
  customerAuthListeners.forEach((listener) => listener());
}

function subscribeToCustomerAuth(listener: () => void) {
  customerAuthListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CUSTOMER_TOKEN_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    customerAuthListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getCustomerTokenSnapshot() {
  return readStoredToken();
}

function getCustomerTokenServerSnapshot() {
  return null;
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const token = useSyncExternalStore(
    subscribeToCustomerAuth,
    getCustomerTokenSnapshot,
    getCustomerTokenServerSnapshot,
  );
  const isLoading = Boolean(token) && !customer;

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const loadCustomer = async () => {
      try {
        const profile = await fetchCustomerProfile(token);

        if (cancelled) {
          return;
        }

        setCustomer(profile);
      } catch {
        if (!cancelled) {
          window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
          setCustomer(null);
          emitCustomerAuthChange();
        }
      }
    };

    void loadCustomer();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      customer,
      token,
      isLoading,
      isLoggedIn: Boolean(customer && token),
      login: (nextCustomer, nextToken) => {
        window.localStorage.setItem(CUSTOMER_TOKEN_KEY, nextToken);
        setCustomer(nextCustomer);
        emitCustomerAuthChange();
      },
      logout: () => {
        window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        setCustomer(null);
        emitCustomerAuthChange();
      },
    }),
    [customer, isLoading, token],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);

  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }

  return context;
}

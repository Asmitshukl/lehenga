"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import logo from "@/photo/logo/hnK8aSlqZBv5pOIXU5O0NeeQfQs.png";

import { useCart } from "../_components/cart-provider";
import { useCustomerAuth } from "../_components/customer-auth-provider";
import { clearBuyNowDraft, readBuyNowDraft, saveBuyNowDraft } from "../_lib/checkout-draft";
import {
  markOnlinePaymentAbandoned,
  markOnlinePaymentInitiated,
  markOnlinePaymentVerified,
} from "../_lib/payment-attempts";
import { createOrder, previewOrder, verifyRazorpayPayment } from "../_lib/store-api";
import type { CartItem, LehengaMeasurements, OrderPreview } from "../_lib/store-types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type CheckoutFormState = {
  couponCode: string;
};

const INITIAL_FORM_STATE: CheckoutFormState = {
  couponCode: "",
};

function mapItemToCheckoutPayload(item: CartItem) {
  if (item.kind === "LEHENGA") {
    return {
      itemType: item.kind,
      lehengaId: item.productId,
      lehengaSizeId: item.selectedSizeId,
      quantity: item.quantity,
      rentalStartDate: item.rentalStartDate ?? "",
      rentalEndDate: item.rentalEndDate ?? "",
      measurements: item.measurements,
    };
  }

  return {
    itemType: item.kind,
    jewelleryId: item.productId,
    quantity: item.quantity,
    rentalStartDate: item.rentalStartDate ?? "",
    rentalEndDate: item.rentalEndDate ?? "",
  };
}

function formatMoney(value: number) {
  return `RS ${value.toLocaleString("en-IN")}`;
}

function formatMeasurementSummary(measurements?: LehengaMeasurements) {
  if (!measurements) {
    return [];
  }

  return [
    measurements.upper ? `Upper: ${measurements.upper}` : null,
    measurements.chest ? `Chest: ${measurements.chest}` : null,
    measurements.waist ? `Waist: ${measurements.waist}` : null,
    measurements.armHole ? `Arm hole: ${measurements.armHole}` : null,
    measurements.mori ? `Mori: ${measurements.mori}` : null,
    measurements.notes ? `Notes: ${measurements.notes}` : null,
  ].filter((value): value is string => Boolean(value));
}

function getRentalDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || diff < 0) {
    return 0;
  }

  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

function formatCheckoutDate(value?: string) {
  if (!value) {
    return "Select date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getOrderTotals(preview: OrderPreview | null, items: CartItem[]) {
  if (preview) {
    return {
      subtotalAmount: preview.subtotalAmount,
      securityDeposit: preview.securityDeposit,
      totalAmount: preview.totalAmount,
    };
  }

  const subtotalAmount = items.reduce((sum, item) => {
    const rentalDays = getRentalDays(item.rentalStartDate, item.rentalEndDate);
    return sum + item.rentalPricePerDay * item.quantity * rentalDays;
  }, 0);

  const securityDeposit = items.reduce((sum, item) => sum + (item.securityDeposit ?? 0) * item.quantity, 0);

  return {
    subtotalAmount,
    securityDeposit,
    totalAmount: subtotalAmount + securityDeposit,
  };
}

function hasCompleteDates(items: CartItem[]) {
  return items.length > 0 && items.every((item) => item.rentalStartDate && item.rentalEndDate);
}

function CheckoutStepper() {
  const steps: Array<{ label: string; complete?: boolean; active?: boolean }> = [
    { label: "Cart", complete: true },
    { label: "Review", complete: true },
    { label: "Checkout", active: true },
  ];

  return (
    <ol className="checkout-stepper" aria-label="Checkout steps">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={`checkout-step${step.active ? " is-active" : ""}${step.complete ? " is-complete" : ""}`}
        >
          <span className="checkout-step-badge">{step.active ? 3 : index + 1}</span>
          <span className="checkout-step-label">{step.label}</span>
          {index < steps.length - 1 ? <span className="checkout-step-line" aria-hidden="true" /> : null}
        </li>
      ))}
    </ol>
  );
}

function CheckoutItemCard({ item, allowDateEdit, onDateChange }: { item: CartItem; allowDateEdit: boolean; onDateChange?: (startDate?: string, endDate?: string) => void }) {
  const measurementSummary = item.kind === "LEHENGA" ? formatMeasurementSummary(item.measurements) : [];

  return (
    <article className="checkout-item-card">
      <div className="checkout-item-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={typeof item.image === "string" ? item.image : item.image.src} alt={item.name} className="checkout-item-image" />
      </div>
      <div className="checkout-item-copy">
        <div className="checkout-item-head">
          <div>
            <h3>{item.name}</h3>
            <p>{item.kind === "JEWELLERY" ? "Jewellery" : item.selectedSizeLabel ?? "Lehenga"}</p>
          </div>
          <strong>{formatMoney(item.rentalPricePerDay * item.quantity)}</strong>
        </div>

        <div className="checkout-item-meta">
          <span>Qty {item.quantity}</span>
          <span>{item.rentalStartDate && item.rentalEndDate ? `${formatCheckoutDate(item.rentalStartDate)} - ${formatCheckoutDate(item.rentalEndDate)}` : "Dates pending"}</span>
        </div>

        {allowDateEdit && onDateChange ? (
          <div className="checkout-date-grid">
            <label className="checkout-input-field">
              <span>Pickup date</span>
              <input
                type="date"
                value={item.rentalStartDate ?? ""}
                onChange={(event) => onDateChange(event.target.value, item.rentalEndDate)}
              />
            </label>
            <label className="checkout-input-field">
              <span>Return date</span>
              <input
                type="date"
                min={item.rentalStartDate || undefined}
                value={item.rentalEndDate ?? ""}
                onChange={(event) => onDateChange(item.rentalStartDate, event.target.value)}
              />
            </label>
          </div>
        ) : null}

        {measurementSummary.length > 0 ? (
          <div className="checkout-pill-list">
            {measurementSummary.map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function CheckoutClient({ mode }: { mode: "buy-now" | "cart" }) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { token, customer, isLoggedIn } = useCustomerAuth();
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(() => (mode === "buy-now" ? readBuyNowDraft() : null));
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [form, setForm] = useState<CheckoutFormState>(INITIAL_FORM_STATE);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const checkoutItems = useMemo(() => {
    return mode === "buy-now" ? (buyNowItem ? [buyNowItem] : []) : items;
  }, [buyNowItem, items, mode]);

  const totals = useMemo(() => getOrderTotals(preview, checkoutItems), [checkoutItems, preview]);

  function updateBuyNowDates(rentalStartDate?: string, rentalEndDate?: string) {
    setBuyNowItem((current) => {
      if (!current) {
        return current;
      }

      const nextItem = {
        ...current,
        rentalStartDate,
        rentalEndDate,
      };

      saveBuyNowDraft(nextItem);
      return nextItem;
    });
  }

  useEffect(() => {
    async function loadPreview() {
      if (!token || checkoutItems.length === 0) {
        setLoadingPreview(false);
        setPreview(null);
        return;
      }

      const hasMissingDates = checkoutItems.some((item) => !item.rentalStartDate || !item.rentalEndDate);

      if (hasMissingDates) {
        setLoadingPreview(false);
        setPreview(null);
        setError(
          mode === "buy-now"
            ? "Please select pickup and return dates below before checkout."
            : "Please select pickup and return dates for every item before checkout.",
        );
        return;
      }

      setLoadingPreview(true);
      setError(null);

      try {
        const nextPreview = await previewOrder(
          {
            items: checkoutItems.map(mapItemToCheckoutPayload),
          },
          token,
        );
        setPreview(nextPreview);
      } catch (previewError) {
        setError(previewError instanceof Error ? previewError.message : "Failed to load checkout summary.");
      } finally {
        setLoadingPreview(false);
      }
    }

    void loadPreview();
  }, [checkoutItems, mode, token]);

  function clearCheckoutSource() {
    if (mode === "buy-now") {
      clearBuyNowDraft();
      setBuyNowItem(null);
      return;
    }

    clearCart();
  }

  async function placeOrder(paymentMethod: "ONLINE" | "PICKUP") {
    if (!token || !customer) {
      setError("Please log in before checking out.");
      return;
    }

    const hasMissingDates = !hasCompleteDates(checkoutItems);

    if (hasMissingDates) {
      setError("Please select pickup and return dates before checkout.");
      return;
    }

    if (paymentMethod === "ONLINE" && !window.Razorpay) {
      setSuccess(null);
      setError("Payment gateway is still loading. Please try again in a moment.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    let initiatedOnlineOrder: { id: string; orderNumber: string } | null = null;

    try {
      const result = await createOrder(
        {
          customerName: `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ""}`,
          customerEmail: customer.email ?? undefined,
          paymentMethod,
          items: checkoutItems.map(mapItemToCheckoutPayload),
        },
        token,
      );

      if (paymentMethod === "PICKUP") {
        clearCheckoutSource();
        setSuccess(`Order ${result.order.orderNumber} was placed successfully. Payment will happen at pickup.`);
        setSubmitting(false);
        return;
      }

      if (!result.razorpayOrder) {
        throw new Error("Unable to start online payment.");
      }

      markOnlinePaymentInitiated(result.order);
      initiatedOnlineOrder = result.order;

      const Razorpay = window.Razorpay;

      if (!Razorpay) {
        throw new Error("Payment gateway is still loading. Please try again in a moment.");
      }

      const razorpay = new Razorpay({
        key: result.razorpayOrder.keyId,
        amount: result.razorpayOrder.amount,
        currency: result.razorpayOrder.currency,
        name: result.razorpayOrder.name,
        description: result.razorpayOrder.description,
        order_id: result.razorpayOrder.id,
        prefill: {
          name: `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ""}`,
          email: customer.email || "",
          contact: customer.phone,
        },
        handler: async (paymentResponse: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyRazorpayPayment(
              {
                orderId: result.order.id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              },
              token,
            );
            markOnlinePaymentVerified(result.order.id);
            clearCheckoutSource();
            setSuccess(`Payment completed for ${result.order.orderNumber}.`);
            router.refresh();
          } catch (verificationError) {
            markOnlinePaymentAbandoned(result.order);
            setError(
              verificationError instanceof Error
                ? verificationError.message
                : "Payment could not be verified, so the order was not completed.",
            );
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            markOnlinePaymentAbandoned(result.order);
            setSuccess(null);
            setError("Payment was not completed, so the order was not placed.");
            setSubmitting(false);
          },
        },
      });

      razorpay.open();
      return;
    } catch (checkoutError) {
      if (paymentMethod === "ONLINE" && initiatedOnlineOrder) {
        markOnlinePaymentAbandoned(initiatedOnlineOrder);
      }
      setError(checkoutError instanceof Error ? checkoutError.message : "Failed to place your order.");
      setSubmitting(false);
    }
  }

  return (
    <main className="lehenga-page checkout-page">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <section className="checkout-shell">
        <div className="checkout-card">
          <div className="checkout-topbar">
            <Link href="/#home" className="checkout-brand" aria-label="Lehenga home">
              <Image src={logo} alt="Lehenga logo" className="checkout-brand-logo" priority />
            </Link>
            <CheckoutStepper />
          </div>

          <div className="checkout-grid">
            <div className="checkout-main-panel">
              <div className="checkout-heading-block">
                <p className="checkout-kicker">Secure checkout</p>
                <h1>Checkout</h1>
                <p>Review the booking details, confirm the dates, and place your order.</p>
              </div>

              {mode === "buy-now" && checkoutItems.length > 0 ? (
                <div className="checkout-section">
                  <div className="checkout-section-head">
                    <h2>Item details</h2>
                    <span>{checkoutItems.length} item(s)</span>
                  </div>
                  <div className="checkout-item-list">
                    {checkoutItems.map((item) => (
                      <CheckoutItemCard
                        key={item.cartLineId}
                        item={item}
                        allowDateEdit
                        onDateChange={updateBuyNowDates}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="checkout-section">
                <div className="checkout-section-head">
                  <h2>Pickup notes</h2>
                  <span>Store pickup only</span>
                </div>
                <div className="checkout-pickup-note">
                  <strong>All orders are collected in-store.</strong>
                  <p>Use the pickup and return dates from the cart or buy-now flow, then complete payment below.</p>
                </div>

                {error ? <p className="checkout-feedback checkout-feedback-error">{error}</p> : null}
                {success ? <p className="checkout-feedback checkout-feedback-success">{success}</p> : null}
              </div>
            </div>

            <aside className="checkout-summary-panel">
              <div className="checkout-section-head checkout-summary-head">
                <div>
                  <h2>Review your cart</h2>
                  <span>{checkoutItems.length} item(s)</span>
                </div>
                <strong>{loadingPreview ? "Loading..." : formatMoney(totals.totalAmount)}</strong>
              </div>

              {!isLoggedIn ? (
                <div className="checkout-empty-state">
                  <p>Please log in before continuing.</p>
                  <div className="checkout-auth-actions">
                    <Link href="/login" className="checkout-button checkout-button-primary">
                      Login
                    </Link>
                    <Link href="/signup" className="checkout-button checkout-button-secondary">
                      Signup
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="checkout-summary-stack">
                  <div className="checkout-summary-list">
                    {checkoutItems.length > 0 ? (
                      checkoutItems.map((item) => (
                        <CheckoutItemCard
                          key={item.cartLineId}
                          item={item}
                          allowDateEdit={mode === "buy-now"}
                          onDateChange={mode === "buy-now" ? updateBuyNowDates : undefined}
                        />
                      ))
                    ) : (
                      <div className="checkout-empty-state">
                        <p>Your checkout is empty.</p>
                      </div>
                    )}
                  </div>

                  <div className="checkout-code-row">
                    <label className="checkout-code-field">
                      <span>Discount code</span>
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={form.couponCode}
                        onChange={(event) => setForm((current) => ({ ...current, couponCode: event.target.value }))}
                      />
                    </label>
                    <button
                      type="button"
                      className="checkout-code-button"
                      onClick={() => {
                        setError("Coupon code is not valid.");
                        setSuccess(null);
                      }}
                    >
                      Apply
                    </button>
                  </div>

                  {preview ? (
                    <dl className="checkout-breakdown">
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{formatMoney(totals.subtotalAmount)}</dd>
                      </div>
                      <div>
                        <dt>Security deposit</dt>
                        <dd>{formatMoney(totals.securityDeposit)}</dd>
                      </div>
                      <div className="checkout-total-row">
                        <dt>Total</dt>
                        <dd>{formatMoney(totals.totalAmount)}</dd>
                      </div>
                    </dl>
                  ) : null}

                  <button
                    type="button"
                    className="checkout-button checkout-button-primary checkout-button-large"
                    disabled={submitting}
                    onClick={() => placeOrder("ONLINE")}
                  >
                    Pay Now
                  </button>
                  <button
                    type="button"
                    className="checkout-button checkout-button-secondary"
                    disabled={submitting}
                    onClick={() => placeOrder("PICKUP")}
                  >
                    Pay at Pickup
                  </button>

                  <div className="checkout-security">
                    <span aria-hidden="true">🔒</span>
                    <div>
                      <strong>Secure Checkout - SSL Encrypted</strong>
                      <p>Ensuring your financial and personal details are secure during every transaction.</p>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { StoreBreadcrumb } from "../_components/store-breadcrumb";
import { useCart } from "../_components/cart-provider";
import { useCustomerAuth } from "../_components/customer-auth-provider";
import { clearBuyNowDraft, readBuyNowDraft, saveBuyNowDraft } from "../_lib/checkout-draft";
import { createOrder, previewOrder, verifyRazorpayPayment } from "../_lib/store-api";
import type { CartItem, LehengaMeasurements, OrderPreview } from "../_lib/store-types";
import { SiteFooter } from "../ui/site-footer";
import { SiteHeader } from "../ui/site-header";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

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

export function CheckoutClient({ mode }: { mode: "buy-now" | "cart" }) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { token, customer, isLoggedIn } = useCustomerAuth();
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(() => (mode === "buy-now" ? readBuyNowDraft() : null));
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const checkoutItems = useMemo(() => {
    return mode === "buy-now" ? (buyNowItem ? [buyNowItem] : []) : items;
  }, [buyNowItem, items, mode]);

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

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createOrder(
        {
          customerName: customer.firstName,
          customerEmail: customer.email ?? undefined,
          paymentMethod,
          specialInstructions: specialInstructions || undefined,
          items: checkoutItems.map(mapItemToCheckoutPayload),
        },
        token,
      );

      if (paymentMethod === "PICKUP") {
        clearCheckoutSource();
        setSuccess(`Order ${result.order.orderNumber} was placed successfully. Payment will happen at pickup.`);
        return;
      }

      if (!result.razorpayOrder || !window.Razorpay) {
        throw new Error("Unable to start online payment.");
      }

      const razorpay = new window.Razorpay({
        key: result.razorpayOrder.keyId,
        amount: result.razorpayOrder.amount,
        currency: result.razorpayOrder.currency,
        name: result.razorpayOrder.name,
        description: result.razorpayOrder.description,
        order_id: result.razorpayOrder.id,
        prefill: {
          name: customer.firstName,
          email: customer.email ?? "",
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
            clearCheckoutSource();
            setSuccess(`Payment completed for ${result.order.orderNumber}.`);
            router.refresh();
          } catch (verificationError) {
            setError(
              verificationError instanceof Error
                ? verificationError.message
                : "Payment was made, but verification failed.",
            );
          } finally {
            setSubmitting(false);
          }
        },
      });

      razorpay.open();
      return;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Failed to place your order.");
    } finally {
      if (paymentMethod === "PICKUP") {
        setSubmitting(false);
      }
    }
  }

  return (
    <main className="lehenga-page">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <SiteHeader />

      <section className="shopall-section">
        <StoreBreadcrumb
          items={[
            { label: "Home", href: "/#home" },
            ...(mode === "buy-now" ? [{ label: "Checkout" }] : [{ label: "Cart", href: "/cart" }, { label: "Checkout" }]),
          ]}
        />

        <div className="cart-layout">
          <div className="cart-items-panel">
            <div className="section-row">
              <h2>Reservation summary</h2>
              <span>{checkoutItems.length} item(s)</span>
            </div>

            <div className="cart-items-list">
              {checkoutItems.map((item) => (
                <article key={item.cartLineId} className="cart-item-card">
                  <div className="cart-item-copy">
                    <h3>{item.name}</h3>
                    <p>
                      {item.rentalStartDate} to {item.rentalEndDate}
                    </p>
                    <p>Qty: {item.quantity}</p>
                    <p>Price: RS {item.rentalPricePerDay.toLocaleString("en-IN")}/night</p>
                    {item.securityDeposit ? <p>Deposit: RS {item.securityDeposit.toLocaleString("en-IN")}</p> : null}
                    {mode === "buy-now" ? (
                      <div className="cart-item-dates">
                        <label className="cart-field">
                          <span>Pickup date</span>
                          <input
                            type="date"
                            value={item.rentalStartDate ?? ""}
                            onChange={(event) => updateBuyNowDates(event.target.value, item.rentalEndDate)}
                          />
                        </label>
                        <label className="cart-field">
                          <span>Return date</span>
                          <input
                            type="date"
                            min={item.rentalStartDate || undefined}
                            value={item.rentalEndDate ?? ""}
                            onChange={(event) => updateBuyNowDates(item.rentalStartDate, event.target.value)}
                          />
                        </label>
                      </div>
                    ) : null}
                    {item.kind === "LEHENGA" && formatMeasurementSummary(item.measurements).length > 0 ? (
                      <div className="cart-item-measurements">
                        <strong>Lehenga details</strong>
                        <div className="cart-detail-pill-list">
                          {formatMeasurementSummary(item.measurements).map((detail) => (
                            <span key={detail}>{detail}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="cart-summary-panel">
            <div className="section-row">
              <h2>Payment</h2>
              <span>{loadingPreview ? "Loading..." : `RS ${preview?.totalAmount.toLocaleString("en-IN") ?? "0"}`}</span>
            </div>

            {!isLoggedIn ? (
              <div className="cart-empty-state">
                <p>Please log in before continuing.</p>
                <div className="cart-auth-actions">
                  <Link href="/login" className="cart-primary-button">
                    Login
                  </Link>
                  <Link href="/signup" className="cart-secondary-button">
                    Signup
                  </Link>
                </div>
              </div>
            ) : (
              <div className="checkout-form">
                {preview ? (
                  <div className="cart-summary-breakdown">
                    <p>Rental subtotal: RS {preview.subtotalAmount.toLocaleString("en-IN")}</p>
                    <p>Security deposit: RS {preview.securityDeposit.toLocaleString("en-IN")}</p>
                    <p>
                      <strong>Grand total: RS {preview.totalAmount.toLocaleString("en-IN")}</strong>
                    </p>
                  </div>
                ) : null}

                <label className="cart-field">
                  <span>Special instructions</span>
                  <textarea
                    rows={4}
                    value={specialInstructions}
                    onChange={(event) => setSpecialInstructions(event.target.value)}
                  />
                </label>

                {error ? <p className="cart-feedback cart-feedback-error">{error}</p> : null}
                {success ? <p className="cart-feedback cart-feedback-success">{success}</p> : null}

                <div className="checkout-choice-actions">
                  <button
                    type="button"
                    className="cart-secondary-button"
                    disabled={submitting || loadingPreview || !preview}
                    onClick={() => placeOrder("PICKUP")}
                  >
                    Pay at Pickup
                  </button>
                  <button
                    type="button"
                    className="cart-primary-button"
                    disabled={submitting || loadingPreview || !preview}
                    onClick={() => placeOrder("ONLINE")}
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

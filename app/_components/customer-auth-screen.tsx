"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { StoreBreadcrumb } from "@/app/_components/store-breadcrumb";
import { useCustomerAuth } from "@/app/_components/customer-auth-provider";
import { filterVisibleOrders } from "@/app/_lib/payment-attempts";
import { fetchMyOrders, loginCustomer, signupCustomer } from "@/app/_lib/store-api";
import type { LehengaMeasurements, StoreOrder } from "@/app/_lib/store-types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatMoney(value: string | number | undefined | null) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function formatAddress(order: StoreOrder) {
  const addressParts = [
    order.pickupLocation?.addressLine1,
    order.pickupLocation?.addressLine2,
    order.pickupLocation?.city,
    order.pickupLocation?.state,
    order.pickupLocation?.postalCode,
    order.pickupLocation?.country,
  ].filter(Boolean);

  return addressParts.join(", ");
}

function formatStatusLabel(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPaymentMethod(value?: string | null) {
  if (!value) {
    return "Pay at pickup";
  }

  return value === "ONLINE" ? "Online payment" : "Pay at pickup";
}

function formatMeasurementSummary(measurements?: LehengaMeasurements | null) {
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

export function CustomerAuthScreen({ mode }: { mode: "login" | "signup" }) {
  const { customer, token, isLoading, isLoggedIn, login, logout } = useCustomerAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      try {
        const nextOrders = filterVisibleOrders(await fetchMyOrders(token));

        if (!cancelled) {
          setOrders(nextOrders);
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
        }
      }
    };

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result =
        mode === "signup"
          ? await signupCustomer({
              firstName: form.firstName,
              lastName: form.lastName || undefined,
              email: form.email,
              phone: form.phone,
              password: form.password,
            })
          : await loginCustomer({
              email: form.email,
              phone: form.phone,
              password: form.password,
            });

      login(result.customer, result.token);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "login" ? "Login" : "Signup";
  const altHref = mode === "login" ? "/signup" : "/login";
  const altLabel = mode === "login" ? "Signup" : "Login";
  const altPrompt = mode === "login" ? "Need an account?" : "Already have an account?";
  const visibleOrders = token ? orders : [];
  const pageLabel = isLoggedIn ? "Account" : title;
  const heroTitle = isLoggedIn ? `Welcome back, ${customer?.firstName ?? "there"}.` : mode === "login"
    ? "Login to continue your rental journey."
    : "Create your account.";
  const heroDescription = isLoggedIn
    ? "Track pickups, payments, deposits, and order details from one clean account space."
    : "Sign in to manage rentals, pickup details, payments, and order history.";
  const activeOrderCount = visibleOrders.filter((order) => order.status !== "COMPLETED" && order.status !== "CANCELLED").length;
  const totalOrderValue = visibleOrders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);

  return (
    <section className="store-auth-shell">
      <StoreBreadcrumb items={[{ label: "Home", href: "/#home" }, { label: pageLabel }]} />

      <div className="store-auth-panels">
        <section className="store-auth-hero">
          <span className="store-auth-kicker">Lehenga</span>
          <h1>{heroTitle}</h1>
          <p>{heroDescription}</p>
        </section>

        <section className="store-auth-card">
          <div className="section-row store-auth-row">
            <h2>{isLoggedIn ? "Your account" : title}</h2>
            {!isLoggedIn ? (
              <p className="store-auth-switch">
                {altPrompt} <Link href={altHref}>{altLabel}</Link>
              </p>
            ) : null}
          </div>

          {isLoggedIn && customer ? (
            <div className="store-profile-card">
              <div className="store-profile-avatar" aria-hidden="true">
                {customer.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="store-profile-main">
                <span className="store-auth-kicker">Signed in as</span>
                <h3>
                  {customer.firstName}
                  {customer.lastName ? ` ${customer.lastName}` : ""}
                </h3>
                <div className="store-profile-detail-grid">
                  <div>
                    <span>Phone</span>
                    <p>{customer.phone}</p>
                  </div>
                  <div>
                    <span>Email</span>
                    <p>{customer.email ?? "Not added"}</p>
                  </div>
                </div>
              </div>
              <button type="button" className="cart-secondary-button" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <label className="cart-field">
                  <span>First name</span>
                  <input
                    required
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  />
                </label>
              ) : null}

              {mode === "signup" ? (
                <label className="cart-field">
                  <span>Last name</span>
                  <input
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  />
                </label>
              ) : null}

              <label className="cart-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>

              <label className="cart-field">
                <span>Phone number</span>
                <input
                  required
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>

              <label className="cart-field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>

              {error ? <p className="cart-feedback cart-feedback-error">{error}</p> : null}

              <button type="submit" className="cart-primary-button" disabled={submitting || isLoading}>
                {submitting ? "Please wait..." : title}
              </button>
            </form>
          )}
        </section>
      </div>

      <section className="store-auth-orders">
        <div className="section-row">
          <div>
            <h2>My orders</h2>
            <p>Pickup schedule, payment status, and product details.</p>
          </div>
          <span>{visibleOrders.length} order(s)</span>
        </div>

        {!isLoggedIn ? (
          <div className="store-auth-empty">
            <h3>Orders appear after login</h3>
            <p>Sign in to view pickup dates, payment status, and booked products.</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="store-auth-empty">
            <h3>No orders yet</h3>
            <p>Your rental history will appear here after checkout.</p>
            <Link href="/shop-all" className="cart-primary-button">
              Browse collection
            </Link>
          </div>
        ) : (
          <div className="store-order-dashboard">
            <div className="store-order-stat">
              <span>Total orders</span>
              <strong>{visibleOrders.length}</strong>
            </div>
            <div className="store-order-stat">
              <span>Active rentals</span>
              <strong>{activeOrderCount}</strong>
            </div>
            <div className="store-order-stat">
              <span>Total value</span>
              <strong>RS {formatMoney(totalOrderValue)}</strong>
            </div>
          </div>
        )}

        {isLoggedIn && visibleOrders.length > 0 ? (
          <div className="store-order-list">
            {visibleOrders.map((order) => (
              <article key={order.id} className="store-order-card">
                <div className="store-order-card-head">
                  <div>
                    <span className="store-auth-kicker">Order</span>
                    <h3>{order.orderNumber}</h3>
                    <p>
                      {formatDate(order.rentalStartDate)} to {formatDate(order.rentalEndDate)}
                    </p>
                  </div>
                  <div className="store-order-total">
                    <span>Total</span>
                    <strong>RS {formatMoney(order.totalAmount)}</strong>
                  </div>
                </div>

                <div className="store-order-status-row">
                  <span>{formatStatusLabel(order.status)}</span>
                  <span>{formatStatusLabel(order.paymentStatus)}</span>
                  <span>{formatPaymentMethod(order.paymentMethod)}</span>
                </div>

                <div className="store-order-actions">
                  <button
                    type="button"
                    className="cart-secondary-button"
                    onClick={() =>
                      setExpandedOrderId((current) => (current === order.id ? null : order.id))
                    }
                  >
                    {expandedOrderId === order.id ? "Hide" : "View"}
                  </button>
                </div>
                {expandedOrderId === order.id ? (
                  <div className="store-order-details">
                    <div className="store-order-detail-grid">
                      <div>
                        <span>Subtotal</span>
                        <p>RS {formatMoney(order.subtotalAmount)}</p>
                      </div>
                      <div>
                        <span>Security deposit</span>
                        <p>RS {formatMoney(order.securityDeposit)}</p>
                      </div>
                      <div>
                        <span>Amount paid</span>
                        <p>RS {formatMoney(order.amountPaid)}</p>
                      </div>
                      <div>
                        <span>Due at pickup</span>
                        <p>RS {formatMoney(order.amountDueAtPickup)}</p>
                      </div>
                      <div>
                        <span>Deposit refund</span>
                        <p>
                          {order.depositRefundStatus ?? "NOT_APPLICABLE"}
                          {order.depositRefundedAmount
                            ? ` · RS ${formatMoney(order.depositRefundedAmount)}`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <span>Placed on</span>
                        <p>{order.createdAt ? formatDate(order.createdAt) : "N/A"}</p>
                      </div>
                      <div>
                        <span>Customer WhatsApp</span>
                        <p>{order.customer?.phone ?? customer?.phone ?? "N/A"}</p>
                      </div>
                      <div>
                        <span>Pickup location</span>
                        <p>{order.pickupLocation?.name ?? "N/A"}</p>
                      </div>
                      <div>
                        <span>Pickup contact</span>
                        <p>{order.pickupLocation?.phone ?? "N/A"}</p>
                      </div>
                    </div>

                    {formatAddress(order) ? (
                      <div className="store-order-detail-block">
                        <span>Pickup address</span>
                        <p>{formatAddress(order)}</p>
                      </div>
                    ) : null}

                    {order.pickupLocation?.pickupNotes ? (
                      <div className="store-order-detail-block">
                        <span>Pickup notes</span>
                        <p>{order.pickupLocation.pickupNotes}</p>
                      </div>
                    ) : null}

                    {order.specialInstructions ? (
                      <div className="store-order-detail-block">
                        <span>Special instructions</span>
                        <p>{order.specialInstructions}</p>
                      </div>
                    ) : null}

                    <div className="store-order-detail-block">
                      <span>Order items</span>
                      <div className="store-order-item-list">
                        {order.items.map((item) => (
                          <article key={item.id} className="store-order-item">
                            <div>
                              <h4>{item.productNameSnapshot}</h4>
                              <p>
                                {item.itemType}
                                {item.sizeLabelSnapshot ? ` · Size ${item.sizeLabelSnapshot}` : ""}
                              </p>
                            </div>
                            <div>
                              <p>Qty: {item.quantity}</p>
                              <p>
                                {item.rentalStartDate && item.rentalEndDate
                                  ? `${formatDate(item.rentalStartDate)} to ${formatDate(item.rentalEndDate)}`
                                  : "Dates pending"}
                              </p>
                              <p>Days: {item.rentalDays ?? "N/A"}</p>
                              <p>Rate: RS {formatMoney(item.pricePerDay)}</p>
                              <p>Deposit: RS {formatMoney(item.depositAmount)}</p>
                              <p>Line total: RS {formatMoney(item.lineTotal)}</p>
                            </div>
                            {formatMeasurementSummary(item.measurements).length > 0 ? (
                              <div className="store-order-item-measurements">
                                <strong>Lehenga details</strong>
                                <div className="cart-detail-pill-list">
                                  {formatMeasurementSummary(item.measurements).map((detail) => (
                                    <span key={detail}>{detail}</span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}

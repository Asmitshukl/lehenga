"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { StoreBreadcrumb } from "@/app/_components/store-breadcrumb";
import { useCustomerAuth } from "@/app/_components/customer-auth-provider";
import { fetchMyOrders, loginCustomer, signupCustomer } from "@/app/_lib/store-api";
import type { StoreOrder } from "@/app/_lib/store-types";

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
        const nextOrders = await fetchMyOrders(token);

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
    ? "You are signed in. You can review your account details, check your orders, or continue to checkout."
    : "A black, white, and light-gray auth experience matched to the updated cart styling.";

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
            <div className="cart-items-list">
              <article className="cart-item-card store-auth-account-card">
                <div className="cart-item-copy">
                  <h3>{customer.firstName}</h3>
                  <p>{customer.phone}</p>
                  {customer.email ? <p>{customer.email}</p> : null}
                </div>
                <div className="cart-item-actions">
                  <button type="button" className="cart-secondary-button" onClick={logout}>
                    Logout
                  </button>
                </div>
              </article>
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
          <h2>My orders</h2>
          <span>{visibleOrders.length} order(s)</span>
        </div>

        {!isLoggedIn ? (
          <div className="cart-empty-state">
            <p>Login to see your orders and continue with checkout.</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="cart-empty-state">
            <p>No orders yet.</p>
          </div>
        ) : (
          <div className="cart-items-list">
            {visibleOrders.map((order) => (
              <article key={order.id} className="cart-item-card store-order-card">
                <div className="cart-item-copy">
                  <h3>{order.orderNumber}</h3>
                  <p>
                    {order.status} · {order.paymentStatus} · {order.paymentMethod ?? "PICKUP"}
                  </p>
                  <p>
                    {formatDate(order.rentalStartDate)} to {formatDate(order.rentalEndDate)}
                  </p>
                  <p>Total: RS {formatMoney(order.totalAmount)}</p>
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
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

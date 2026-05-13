"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";

import { useCart } from "../_components/cart-provider";
import { useCustomerAuth } from "../_components/customer-auth-provider";
import { createOrder } from "../_lib/store-api";
import { SiteFooter } from "../ui/site-footer";
import { SiteHeader } from "../ui/site-header";

function ProductImage({ image, name }: { image: string | StaticImageData; name: string }) {
  if (typeof image === "string") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name} className="product-card-image" />
    );
  }

  return <Image src={image} alt={name} className="product-card-image" />;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, updateSize, clearCart } = useCart();
  const { customer, token, isLoggedIn } = useCustomerAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: customer?.firstName ?? "",
    customerEmail: customer?.email ?? "",
    rentalStartDate: "",
    rentalEndDate: "",
    specialInstructions: "",
  });

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.rentalPricePerDay * item.quantity, 0),
    [items],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const liveItems = items.filter((item) => !item.isMock);

    if (liveItems.length === 0) {
      setError("Add at least one live item before placing an order.");
      setSubmitting(false);
      return;
    }

    if (!token) {
      setError("Please log in before placing your order.");
      setSubmitting(false);
      return;
    }

    try {
      await createOrder(
        {
          customerName: form.customerName || customer?.firstName,
          customerEmail: form.customerEmail || customer?.email || undefined,
          rentalStartDate: form.rentalStartDate,
          rentalEndDate: form.rentalEndDate,
          specialInstructions: form.specialInstructions || undefined,
          items: liveItems.map((item) =>
            item.kind === "LEHENGA"
              ? {
                  itemType: item.kind,
                  lehengaId: item.productId,
                  lehengaSizeId: item.selectedSizeId,
                  quantity: item.quantity,
                }
              : {
                  itemType: item.kind,
                  jewelleryId: item.productId,
                  quantity: item.quantity,
                },
          ),
        },
        token,
      );

      clearCart();
      setForm({
        customerName: customer?.firstName ?? "",
        customerEmail: customer?.email ?? "",
        rentalStartDate: "",
        rentalEndDate: "",
        specialInstructions: "",
      });
      setSuccessMessage("Your order has been placed successfully.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="lehenga-page">
      <SiteHeader />

      <section className="shopall-section">
        <div className="shopall-breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-muted">Home</span>
          <span className="breadcrumb-sep" aria-hidden="true">
            &gt;
          </span>
          <span>Cart</span>
        </div>

        <div className="cart-layout">
          <div className="cart-items-panel">
            <div className="section-row">
              <h2>Cart</h2>
              <div className="cart-heading-actions">
                <span>{items.length} item(s)</span>
                {items.length > 0 ? (
                  <button type="button" className="cart-clear-button" onClick={clearCart}>
                    Clear cart
                  </button>
                ) : null}
              </div>
            </div>

            {items.length === 0 ? (
              <div className="cart-empty-state">
                <p>Your cart is empty right now.</p>
                <Link href="/shop-all" className="cart-primary-button">
                  Browse lehengas
                </Link>
              </div>
            ) : (
              <div className="cart-items-list">
                {items.map((item) => (
                  <article
                    key={`${item.kind}-${item.productId}-${item.selectedSizeId ?? "default"}`}
                    className="cart-item-card"
                  >
                    <div className="product-card-image-wrap cart-item-media">
                      <ProductImage image={item.image} name={item.name} />
                    </div>
                    <div className="cart-item-copy">
                      <h3>{item.name}</h3>
                      <p>RS {item.rentalPricePerDay.toLocaleString("en-IN")}/night</p>
                      {item.availableSizes.length > 0 ? (
                        <label className="cart-field">
                          <span>Size</span>
                          <select
                            value={item.selectedSizeId}
                            onChange={(event) =>
                              updateSize(item.productId, item.kind, item.selectedSizeId, event.target.value)
                            }
                          >
                            {item.availableSizes.map((size) => (
                              <option key={size.id} value={size.id}>
                                {size.sizeLabel}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <p>{item.kind === "JEWELLERY" ? "Jewellery item" : "Mock preview item"}</p>
                      )}
                    </div>
                    <div className="cart-item-actions">
                      <label className="cart-field">
                        <span>Qty</span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(
                              item.productId,
                              item.kind,
                              Number(event.target.value || 1),
                              item.selectedSizeId,
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="cart-secondary-button"
                        onClick={() => removeItem(item.productId, item.kind, item.selectedSizeId)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="cart-summary-panel">
            <div className="section-row">
              <h2>Checkout</h2>
              <span>Subtotal: RS {subtotal.toLocaleString("en-IN")}</span>
            </div>

            {!isLoggedIn ? (
              <div className="cart-empty-state">
                <p>Please log in before placing your order.</p>
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
              <form className="checkout-form" onSubmit={handleSubmit}>
                <label className="cart-field">
                  <span>Name</span>
                  <input
                    required
                    value={form.customerName}
                    onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                  />
                </label>
                <label className="cart-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(event) => setForm((current) => ({ ...current, customerEmail: event.target.value }))}
                  />
                </label>
                <label className="cart-field">
                  <span>Rental start date</span>
                  <input
                    type="date"
                    required
                    value={form.rentalStartDate}
                    onChange={(event) => setForm((current) => ({ ...current, rentalStartDate: event.target.value }))}
                  />
                </label>
                <label className="cart-field">
                  <span>Rental end date</span>
                  <input
                    type="date"
                    required
                    value={form.rentalEndDate}
                    onChange={(event) => setForm((current) => ({ ...current, rentalEndDate: event.target.value }))}
                  />
                </label>
                <label className="cart-field">
                  <span>Special instructions</span>
                  <textarea
                    rows={4}
                    value={form.specialInstructions}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, specialInstructions: event.target.value }))
                    }
                  />
                </label>

                {error ? <p className="cart-feedback cart-feedback-error">{error}</p> : null}
                {successMessage ? <p className="cart-feedback cart-feedback-success">{successMessage}</p> : null}

                <button
                  type="submit"
                  className="cart-primary-button cart-submit-button"
                  disabled={submitting || items.length === 0}
                >
                  {submitting ? "Placing order..." : "Place order"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

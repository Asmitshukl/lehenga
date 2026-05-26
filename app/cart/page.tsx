"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { StoreBreadcrumb } from "../_components/store-breadcrumb";
import { useCart } from "../_components/cart-provider";
import { useCustomerAuth } from "../_components/customer-auth-provider";
import { SiteFooter } from "../ui/site-footer";
import { SiteHeader } from "../ui/site-header";

function ProductImage({ image, name }: { image: string | StaticImageData; name: string }) {
  if (typeof image === "string") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className="product-card-image" />;
  }

  return <Image src={image} alt={name} className="product-card-image" />;
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

export default function CartPage() {
  const { items, removeItem, updateQuantity, updateSize, updateDates, clearCart } = useCart();
  const { isLoggedIn } = useCustomerAuth();

  const totals = useMemo(() => {
    return items.reduce(
      (summary, item) => {
        const rentalDays = getRentalDays(item.rentalStartDate, item.rentalEndDate);
        const lineRentalTotal = item.rentalPricePerDay * item.quantity * rentalDays;
        const lineDepositTotal = (item.securityDeposit ?? 0) * item.quantity;

        return {
          subtotal: summary.subtotal + lineRentalTotal,
          depositTotal: summary.depositTotal + lineDepositTotal,
          grandTotal: summary.grandTotal + lineRentalTotal + lineDepositTotal,
        };
      },
      { subtotal: 0, depositTotal: 0, grandTotal: 0 },
    );
  }, [items]);

  return (
    <main className="lehenga-page">
      <SiteHeader />

      <section className="shopall-section">
        <StoreBreadcrumb items={[{ label: "Home", href: "/#home" }, { label: "Cart" }]} />

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
                {items.map((item) => {
                  const rentalDays = getRentalDays(item.rentalStartDate, item.rentalEndDate);
                  const lineRentalTotal = item.rentalPricePerDay * item.quantity * rentalDays;
                  const lineDepositTotal = (item.securityDeposit ?? 0) * item.quantity;

                  return (
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
                        {item.securityDeposit ? <p>Deposit: RS {item.securityDeposit.toLocaleString("en-IN")}</p> : null}
                        {item.availableSizes.length > 1 ? (
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
                          <p>{item.kind === "JEWELLERY" ? "Jewellery item" : "Free Size"}</p>
                        )}

                        <div className="cart-item-dates">
                          <label className="cart-field">
                            <span>Pickup date</span>
                            <input
                              type="date"
                              value={item.rentalStartDate ?? ""}
                              onChange={(event) =>
                                updateDates(
                                  item.productId,
                                  item.kind,
                                  item.selectedSizeId,
                                  event.target.value,
                                  item.rentalEndDate,
                                )
                              }
                            />
                          </label>
                          <label className="cart-field">
                            <span>Return date</span>
                            <input
                              type="date"
                              min={item.rentalStartDate || undefined}
                              value={item.rentalEndDate ?? ""}
                              onChange={(event) =>
                                updateDates(
                                  item.productId,
                                  item.kind,
                                  item.selectedSizeId,
                                  item.rentalStartDate,
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                        </div>

                        <div className="cart-item-pricing">
                          <span>Days: {rentalDays || "-"}</span>
                          <span>Rental: RS {lineRentalTotal.toLocaleString("en-IN")}</span>
                          <span>Deposit: RS {lineDepositTotal.toLocaleString("en-IN")}</span>
                        </div>
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
                  );
                })}
              </div>
            )}
          </div>

          <div className="cart-summary-panel">
            <div className="section-row">
              <h2>Checkout</h2>
              <span>Total: RS {totals.grandTotal.toLocaleString("en-IN")}</span>
            </div>

            {!isLoggedIn ? (
              <div className="cart-empty-state">
                <p>Please log in before continuing to checkout.</p>
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
                <div className="cart-summary-breakdown">
                  <p>Rental subtotal: RS {totals.subtotal.toLocaleString("en-IN")}</p>
                  <p>Security deposit: RS {totals.depositTotal.toLocaleString("en-IN")}</p>
                  <p>
                    <strong>Grand total: RS {totals.grandTotal.toLocaleString("en-IN")}</strong>
                  </p>
                </div>

                <Link href="/checkout?mode=cart" className="cart-primary-button">
                  Proceed to checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

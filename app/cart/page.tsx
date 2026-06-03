"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useState } from "react";

import { LehengaDetailsDialog } from "../_components/lehenga-details-dialog";
import { StoreBreadcrumb } from "../_components/store-breadcrumb";
import { useCart } from "../_components/cart-provider";
import type { CartItem, LehengaMeasurements } from "../_lib/store-types";
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

export default function CartPage() {
  const { items, removeItem, updateQuantity, updateSize, updateDates, updateMeasurements, clearCart } = useCart();
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);

  const totals = items.reduce(
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

  const editingItem =
    editingItemKey === null
      ? null
      : items.find((item) => item.cartLineId === editingItemKey) ?? null;

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
                  const measurementSummary = formatMeasurementSummary(item.measurements);

                  return (
                    <article
                      key={item.cartLineId}
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
                              onChange={(event) => updateSize(item.cartLineId, event.target.value)}
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
                                updateDates(item.cartLineId, event.target.value, item.rentalEndDate)
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
                                updateDates(item.cartLineId, item.rentalStartDate, event.target.value)
                              }
                            />
                          </label>
                        </div>

                        <div className="cart-item-pricing">
                          <span>Days: {rentalDays || "-"}</span>
                          <span>Rental: RS {lineRentalTotal.toLocaleString("en-IN")}</span>
                          <span>Deposit: RS {lineDepositTotal.toLocaleString("en-IN")}</span>
                        </div>
                        {item.kind === "LEHENGA" ? (
                          <div className="cart-item-measurements">
                            <div className="cart-item-measurements-head">
                              <strong>Saved lehenga details</strong>
                              <button
                                type="button"
                                className="cart-link-button"
                                onClick={() =>
                                  setEditingItemKey(item.cartLineId)
                                }
                              >
                                {measurementSummary.length > 0 ? "Edit details" : "Add details"}
                              </button>
                            </div>
                            {measurementSummary.length > 0 ? (
                              <div className="cart-detail-pill-list">
                                {measurementSummary.map((detail) => (
                                  <span key={detail}>{detail}</span>
                                ))}
                              </div>
                            ) : (
                              <p>Fill this form before checkout so the stitching details stay attached to this lehenga.</p>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <div className="cart-item-actions">
                        <label className="cart-field">
                          <span>Qty</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(item.cartLineId, Number(event.target.value || 1))
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="cart-secondary-button"
                          onClick={() => removeItem(item.cartLineId)}
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
          </div>
        </div>
      </section>

      <SiteFooter />
      {editingItem ? (
        <LehengaDetailsDialog
          key={editingItem.cartLineId}
          productName={editingItem.name}
          initialMeasurements={editingItem.measurements}
          submitLabel="Save details"
          onClose={() => setEditingItemKey(null)}
          onSubmit={(nextMeasurements) => {
            updateMeasurements(editingItem.cartLineId, nextMeasurements as CartItem["measurements"]);
            setEditingItemKey(null);
          }}
        />
      ) : null}
    </main>
  );
}

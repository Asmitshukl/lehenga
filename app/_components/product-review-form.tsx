"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCustomerAuth } from "./customer-auth-provider";
import { submitProductReview } from "../_lib/store-api";
import type { StoreProduct } from "../_lib/store-types";

export function ProductReviewForm({ product }: { product: StoreProduct }) {
  const router = useRouter();
  const { token, isLoggedIn } = useCustomerAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    if (!token) {
      setError("Please log in to submit a review.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await submitProductReview(
        product.kind === "LEHENGA"
          ? {
              itemType: product.kind,
              lehengaId: product.id,
              rating,
              comment,
            }
          : {
              itemType: product.kind,
              jewelleryId: product.id,
              rating,
              comment,
            },
        token,
      );
      setComment("");
      setSuccess("Your review was saved.");
      router.refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Failed to save your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="product-detail-review-card">
      <h2>Customer Reviews</h2>
      <div className="product-detail-review-stars" aria-label={`Selected rating ${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`product-detail-star-button${value <= rating ? " is-active" : ""}`}
            onClick={() => setRating(value)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="product-detail-review-input"
        placeholder={isLoggedIn ? "Write your review" : "Log in to write a review"}
        rows={4}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        disabled={!isLoggedIn || submitting}
      />
      {error ? <p className="cart-feedback cart-feedback-error">{error}</p> : null}
      {success ? <p className="cart-feedback cart-feedback-success">{success}</p> : null}
      <div className="product-detail-review-actions">
        <button type="button" className="product-detail-primary-button is-compact" onClick={handleSubmit} disabled={!isLoggedIn || submitting || comment.trim().length < 8}>
          {submitting ? "Saving..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}

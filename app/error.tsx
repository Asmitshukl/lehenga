"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="lehenga-page">
      <section className="shopall-section">
        <div className="catalog-request-state is-error" role="alert">
          <strong>Something went wrong.</strong>
          <p>{error.message || "Please try loading this page again."}</p>
          <button type="button" className="discover-button" onClick={reset}>
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}

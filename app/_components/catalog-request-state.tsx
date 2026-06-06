"use client";

export function CatalogLoader({ label = "Loading styles" }: { label?: string }) {
  return (
    <div className="catalog-request-state" role="status" aria-live="polite">
      <span className="catalog-loader" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function CatalogError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="catalog-request-state is-error" role="alert">
      <strong>We could not load the collection.</strong>
      <p>{message}</p>
      <button type="button" className="discover-button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

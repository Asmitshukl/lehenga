import { CatalogLoader } from "./_components/catalog-request-state";

export default function Loading() {
  return (
    <main className="lehenga-page">
      <section className="shopall-section">
        <CatalogLoader label="Preparing the collection" />
      </section>
    </main>
  );
}

import { notFound } from "next/navigation";

import { StoreProductDetail } from "@/app/_components/store-product-detail";
import { fetchJewelleryBySlug } from "@/app/_lib/store-api";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

export default async function JewelleryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchJewelleryBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="lehenga-page">
      <SiteHeader />
      <StoreProductDetail product={product} listingHref="/jewellery" listingLabel="Jewellery" />
      <SiteFooter />
    </main>
  );
}

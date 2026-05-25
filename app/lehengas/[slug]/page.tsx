import { notFound } from "next/navigation";

import { StoreProductDetail } from "@/app/_components/store-product-detail";
import { fetchJewelleryProducts, fetchLehengaBySlug, fetchLiveProducts } from "@/app/_lib/store-api";
import type { StoreProduct } from "@/app/_lib/store-types";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

function prioritizeCategoryMatches(products: StoreProduct[], currentProduct: StoreProduct) {
  return [...products].sort((left, right) => {
    const leftMatchesCategory = left.categoryId && left.categoryId === currentProduct.categoryId ? 1 : 0;
    const rightMatchesCategory = right.categoryId && right.categoryId === currentProduct.categoryId ? 1 : 0;

    if (leftMatchesCategory !== rightMatchesCategory) {
      return rightMatchesCategory - leftMatchesCategory;
    }

    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

    return rightTime - leftTime;
  });
}

export default async function LehengaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, lehengas, jewellery] = await Promise.all([
    fetchLehengaBySlug(slug),
    fetchLiveProducts(),
    fetchJewelleryProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const relatedLehengas = prioritizeCategoryMatches(
    lehengas.filter((lehenga) => lehenga.id !== product.id),
    product,
  ).slice(0, 4);

  const pairedJewellery = prioritizeCategoryMatches(jewellery, product).slice(0, 4);

  return (
    <main className="lehenga-page">
      <SiteHeader />
      <StoreProductDetail
        product={product}
        listingHref="/shop-all"
        listingLabel="Lehengas"
        relatedLehengas={relatedLehengas}
        pairedJewellery={pairedJewellery}
      />
      <SiteFooter />
    </main>
  );
}

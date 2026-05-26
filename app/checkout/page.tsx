import { CheckoutClient } from "./checkout-client";

type CheckoutPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const resolvedSearchParams = await searchParams;
  const mode = resolvedSearchParams.mode === "buy-now" ? "buy-now" : "cart";

  return <CheckoutClient mode={mode} />;
}

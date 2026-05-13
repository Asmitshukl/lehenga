import { CustomerAuthScreen } from "@/app/_components/customer-auth-screen";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";

export default function LoginPage() {
  return (
    <main className="lehenga-page">
      <SiteHeader />
      <CustomerAuthScreen mode="login" />
      <SiteFooter />
    </main>
  );
}

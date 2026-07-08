import type { Metadata } from "next";
import { CartProvider } from "./_components/cart-provider";
import { CustomerAuthProvider } from "./_components/customer-auth-provider";
import { FloatingWhatsApp } from "./ui/floating-whatsapp";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lehenga",
  description: "Luxury lehenga rental storefront",
  icons: {
    icon: "/hnK8aSlqZBv5pOIXU5O0NeeQfQs.png",
    apple: "/hnK8aSlqZBv5pOIXU5O0NeeQfQs.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">
        <CustomerAuthProvider>
          <CartProvider>
            {children}
            <FloatingWhatsApp />
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}

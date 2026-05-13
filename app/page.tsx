"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import heroImage from "@/photo/caiCUuW1TZ7czKzGUaaidkP3aAc.png";
import bannerImage from "@/photo/VJbzfU61Ujlrt6Ru69p69ie81s (1).jpg";
import { SiteFooter } from "@/app/ui/site-footer";
import { SiteHeader } from "@/app/ui/site-header";
import { StoreProductCard } from "./_components/store-product-card";
import { fetchFeaturedCollections, fetchLatestProducts } from "./_lib/store-api";
import type { StoreCollection, StoreProduct } from "./_lib/store-types";

const faqItems = [
  {
    question: "How do I browse lehenga collections on this website?",
    answer:
      "Use the navigation links or homepage sections to explore collections, jewellery sets, and featured lehengas from the store.",
  },
  {
    question: "Can I place an order without creating an account?",
    answer:
      "You can browse products without signing in, but creating an account makes checkout faster and lets you track orders from your profile.",
  },
  {
    question: "What payment methods are supported for purchases?",
    answer:
      "The site supports online payment options available at checkout. If you need help, use the contact details provided on the site.",
  },
  {
    question: "How can I check the status of my order?",
    answer:
      "After placing an order, you can view order details and status in the My Orders section of your account.",
  },
  {
    question: "Where can I find customer support for returns or product questions?",
    answer:
      "Visit the contact or help section on the website for support information, or use the provided email and phone details.",
  },
];

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 fill-current">
      <path d="M4 10a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 stroke-current">
      <path d="M10 2.75v14.5M2.75 10h14.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ProductSection({
  id,
  title,
  href,
  products,
}: {
  id: string;
  title: string;
  href: string;
  products: StoreCollection["products"];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section id={id} className="catalog-section">
      <div className="section-row">
        <h2>{title}</h2>
        <Link href={href} className="discover-button">
          Discover more
        </Link>
      </div>

      <div className="product-grid-shell">
        <div className="product-grid">
          {products.map((product) => (
            <StoreProductCard key={`${id}-${product.kind}-${product.id}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function getLatestSectionProducts(products: StoreProduct[], limit = 4) {
  return [...products]
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

      return rightTime - leftTime;
    })
    .slice(0, limit);
}

function FaqSection() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqItems[0]?.question ?? null);
  const items = useMemo(() => faqItems, []);

  return (
    <section className="faq-section">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        {items.map((item) => {
          const isOpen = item.question === openQuestion;
          return (
            <article key={item.question} className="faq-item">
              <button
                type="button"
                className="faq-question-row"
                aria-expanded={isOpen}
                onClick={() => setOpenQuestion(isOpen ? null : item.question)}
              >
                <h3>{item.question}</h3>
                <span className="faq-icon" aria-hidden="true">
                  {isOpen ? <MinusIcon /> : <PlusIcon />}
                </span>
              </button>
              {isOpen ? (
                <>
                  <div className="faq-divider" />
                  <p>{item.answer}</p>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const [latestDrop, setLatestDrop] = useState<StoreProduct[]>([]);
  const [collections, setCollections] = useState<StoreCollection[]>([]);
  const [menuOpenSignal, setMenuOpenSignal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadHomepage = async () => {
      const [liveLatestDrop, featuredCollections] = await Promise.all([
        fetchLatestProducts(4),
        fetchFeaturedCollections(5),
      ]);

      if (cancelled) {
        return;
      }

      setLatestDrop(liveLatestDrop);
      setCollections(featuredCollections);
    };

    void loadHomepage();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main id="home" className="lehenga-page">
      <SiteHeader openSignal={menuOpenSignal} variant="overlay" />

      <section className="hero-section">
        <div
          className="hero-image-wrap"
          role="button"
          tabIndex={0}
          aria-label="Open menu"
          onClick={() => setMenuOpenSignal((prev) => prev + 1)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setMenuOpenSignal((prev) => prev + 1);
            }
          }}
        >
          <Image
            src={heroImage}
            alt="Bride wearing a luxury red lehenga"
            className="hero-image"
            priority
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Luxury Lehengas</h1>
          <p>Without the Lifetime Commitment.</p>
          <Link href="/shop-all" className="hero-button">
            Shop Now
          </Link>
        </div>
      </section>

      <ProductSection id="collections" title="Latest Drop" href="/shop-all" products={latestDrop} />

      {collections.map((collection, index) => (
        <ProductSection
          key={collection.id}
          id={`collection-${index}-${collection.slug}`}
          title={collection.name}
          href="/collections"
          products={getLatestSectionProducts(collection.products)}
        />
      ))}

      <section className="promo-section">
        <div className="promo-card">
          <Image
            src={bannerImage}
            alt="Colourful textile background"
            className="promo-image"
          />
          <div className="promo-overlay" />
          <div className="promo-content">
            <h2>Wear the Moment. Return the Lehenga</h2>
            <p>One Night. One Lehenga. Zero Regrets</p>
            <Link href="/shop-all" className="hero-button">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <FaqSection />

      <SiteFooter />
    </main>
  );
}

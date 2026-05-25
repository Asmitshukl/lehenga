"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import bannerImage from "@/photo/VJbzfU61Ujlrt6Ru69p69ie81s (1).jpg";

const faqItems = [
  {
    question: "How do I browse lehenga categories on this website?",
    answer:
      "Use the navigation links or homepage sections to explore categories, jewellery sets, and featured lehengas from the store.",
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

export function StorePromoBanner() {
  return (
    <section className="promo-section">
      <div className="promo-card">
        <Image src={bannerImage} alt="Colourful textile background" className="promo-image" />
        <div className="promo-overlay" />
        <div className="promo-content">
          <div className="promo-pill">Season special</div>
          <h2>Wear the Moment. Return the Lehenga</h2>
          <p>One Night. One Lehenga. Zero Regrets</p>
          <Link href="/shop-all" className="hero-button">
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}

export function StoreFaqSection() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqItems[0]?.question ?? null);

  return (
    <section className="faq-section">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqItems.map((item) => {
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

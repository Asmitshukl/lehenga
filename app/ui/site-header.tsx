"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCart } from "@/app/_components/cart-provider";
import { useCustomerAuth } from "@/app/_components/customer-auth-provider";
import logo from "@/photo/logo/hnK8aSlqZBv5pOIXU5O0NeeQfQs.png";
import cartIcon from "@/photo/logo/dowload.svg";

const navigationLinks = [
  { label: "New in", href: "/#home" },
  { label: "Categories", href: "/collections" },
  { label: "Jewellery", href: "/jewellery" },
  { label: "Shop all", href: "/shop-all" },
];

type MenuItem = {
  label: string;
  href?: string;
  muted?: boolean;
};

type MenuColumn = {
  title: string;
  items: MenuItem[];
};

const menuColumns: MenuColumn[] = [
  {
    title: "",
    items: [
      { label: "New arrival", href: "/shop-all" },
      { label: "All categories", href: "/collections" },
      { label: "Bridal wear", href: "/collections" },
      { label: "Groom wear", href: "/collections" },
      { label: "Bridesmaid edits", href: "/collections" },
    ],
  },
  {
    title: "Accessories",
    items: [{ label: "Jewellery", href: "/jewellery" }],
  },
  {
    title: "Shop by category",
    items: [
      { label: "Wedding looks", muted: true },
      { label: "Reception styles", muted: true },
      { label: "Festive fits", muted: true },
    ],
  },
];

const colorChips = [
  { name: "Blues", swatch: "#5977d8" },
  { name: "Red", swatch: "#a23f39" },
  { name: "Green", swatch: "#4f9f43" },
];

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-current">
      <path d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12Zm0 2.1c-4.17 0-7.55 2.07-7.55 4.63 0 .38.31.69.69.69h13.72a.69.69 0 0 0 .69-.69c0-2.56-3.38-4.63-7.55-4.63Z" />
    </svg>
  );
}

function CartIcon({ itemCount }: { itemCount: number }) {
  return (
    <span className="nav-cart-wrap">
      <Image src={cartIcon} alt="" aria-hidden="true" className="nav-cart-icon" />
      {itemCount > 0 ? <span className="nav-cart-badge">{itemCount}</span> : null}
    </span>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-8 stroke-current">
      <path d="M4 7h16M4 17h16" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MenuPanel() {
  return (
    <section id="lehenga-mega-menu" className="mega-menu" aria-label="Categories menu">
      <div className="mega-menu-columns">
        {menuColumns.map((column) => (
          <div key={column.title || "categories"} className="mega-menu-column">
            {column.title ? <h3>{column.title}</h3> : null}
            <ul>
              {column.items.map((item) => (
                <li key={item.label} className={item.muted ? "is-muted" : undefined}>
                  {item.href && !item.muted ? <Link href={item.href}>{item.label}</Link> : item.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mega-menu-column colors">
          <h3>Shop by colour</h3>
          <div className="color-chip-list">
            {colorChips.map((chip) => (
              <span key={chip.name} className="color-chip">
                {chip.name}
                <span className="swatch" style={{ backgroundColor: chip.swatch }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteHeader({
  openSignal,
  variant = "default",
}: {
  openSignal?: number;
  variant?: "default" | "overlay";
}) {
  const { itemCount } = useCart();
  const { customer } = useCustomerAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);

  useEffect(() => {
    if (variant !== "overlay") return;

    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (!openSignal) return;

    const timer = window.setTimeout(() => {
      openMenu();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [openMenu, openSignal]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenu, isMenuOpen]);

  const links = useMemo(() => navigationLinks, []);
  const accountLabel = customer ? customer.firstName : "Account";

  return (
    <>
      <header
        className={
          variant === "overlay"
            ? `lehenga-header is-overlay${isScrolled ? " is-scrolled" : ""}`
            : "lehenga-header"
        }
      >
        <nav className="lehenga-nav" aria-label="Primary">
          <div className="lehenga-nav-links">
            {links.map((link) => (
              <Link key={link.label} href={link.href} className={link.label === "Shop all" ? "is-muted" : undefined}>
                {link.label}
              </Link>
            ))}
          </div>
          <Link href="/#home" className="lehenga-logo-link" aria-label="Lehenga home">
            <Image src={logo} alt="Lehenga logo" className="lehenga-logo" priority />
          </Link>
          <div className="lehenga-actions" aria-label="Account and cart">
            <button type="button" aria-label={accountLabel} onClick={() => router.push("/login")}>
              <UserIcon />
            </button>
            <Link href="/cart" aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ""}`}>
              <CartIcon itemCount={itemCount} />
            </Link>
            <button
              type="button"
              aria-label="Menu"
              className="lehenga-menu-button"
              aria-expanded={isMenuOpen}
              aria-controls="lehenga-mega-menu"
              onClick={toggleMenu}
            >
              <MenuIcon />
            </button>
          </div>
        </nav>
      </header>

      {isMenuOpen ? (
        <div className="mega-menu-backdrop" role="presentation" onClick={closeMenu}>
          <div className="mega-menu-modal" role="dialog" aria-modal="true">
            <div className="mega-menu-modal-inner" onClick={(event) => event.stopPropagation()}>
              <MenuPanel />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

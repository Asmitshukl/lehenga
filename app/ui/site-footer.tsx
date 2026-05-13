import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Footer">
      <div className="site-footer-card">
        <div className="site-footer-left">
          <h2>Lehenga Rental</h2>
          <p>
            Curated lehengas for every celebration.
            <br />
            Wear it once, own the moment.
            <br />
            Return it—no strings attached.
          </p>

          <div className="site-footer-social" aria-label="Social links">
            <a href="#" aria-label="Instagram">
              IG
            </a>
            <a href="#" aria-label="Facebook">
              F
            </a>
            <a href="#" aria-label="LinkedIn">
              in
            </a>
            <a href="#" aria-label="X">
              X
            </a>
            <a href="#" aria-label="YouTube">
              YT
            </a>
          </div>

          <div className="site-footer-divider" />
          <small>CC 2024 Lehenga Rental. All rights reserved</small>
        </div>

        <div className="site-footer-right">
          <div className="site-footer-pages">
            <h3>Pages</h3>
            <Link href="/#home">Home</Link>
            <a href="#">About Us</a>
            <a href="#">Contact Us</a>
          </div>

          <div className="site-footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

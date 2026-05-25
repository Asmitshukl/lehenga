import Link from "next/link";

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="site-footer-social-icon">
      <path d="M5.8 0h8.4A5.8 5.8 0 0 1 20 5.8v8.4A5.8 5.8 0 0 1 14.2 20H5.8A5.8 5.8 0 0 1 0 14.2V5.8A5.8 5.8 0 0 1 5.8 0Zm0 2A3.8 3.8 0 0 0 2 5.8v8.4A3.8 3.8 0 0 0 5.8 18h8.4a3.8 3.8 0 0 0 3.8-3.8V5.8A3.8 3.8 0 0 0 14.2 2Zm9.45 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM10 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20.05 20" className="site-footer-social-icon">
      <path d="M20.05 10.025C20.05 4.49 15.56 0 10.025 0S0 4.49 0 10.025c0 4.852 3.45 8.892 8.02 9.825v-6.817H6.015v-3.008H8.02V7.52c0-1.935 1.574-3.51 3.509-3.51h2.506v3.008H12.03c-.551 0-1.002.451-1.002 1.002v2.005h3.007v3.008h-3.007V20c5.062-.501 9.022-4.772 9.022-9.975Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="site-footer-social-icon">
      <path d="M17.778 0A2.222 2.222 0 0 1 20 2.222v15.556A2.222 2.222 0 0 1 17.778 20H2.222A2.222 2.222 0 0 1 0 17.778V2.222A2.222 2.222 0 0 1 2.222 0ZM5.856 7.922H2.778v9.3h3.078Zm-1.545-5.49a1.878 1.878 0 1 0 0 3.756 1.878 1.878 0 0 0 0-3.756Zm12.911 8.901c0-2-1.622-3.622-3.622-3.622-.944 0-2.044.578-2.578 1.445V7.922h-3.1v9.3h3.1v-5.478c0-.855.689-1.555 1.545-1.555.859 0 1.555.696 1.555 1.555v5.478h3.1Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 21 20" className="site-footer-social-icon">
      <path d="M12.795 8.533 19.68 0h-3.073l-5.255 6.517L6.69 0H0l7.806 10.91L.47 20h3.074l5.705-7.07L14.31 20H21Zm-2.38 2.95-1.445-2.02L3.36 1.628h2.31l4.528 6.317 1.443 2.02 6.018 8.408h-2.31Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 25.51 17.857" className="site-footer-social-icon">
      <path d="M10.204 12.755 16.824 8.93l-6.62-3.827Zm14.745-9.987c.166.6.281 1.403.357 2.423.089 1.02.128 1.9.128 2.665l.076 1.071c0 2.793-.204 4.847-.561 6.16-.319 1.148-1.059 1.888-2.207 2.207-.599.166-1.696.281-3.38.357-1.658.089-3.176.128-4.579.128l-2.028.076c-5.344 0-8.673-.204-9.987-.561C1.62 16.977.88 16.237.561 15.089.395 14.49.281 13.686.204 12.666.115 11.645.077 10.765.077 10L0 8.93c0-2.794.204-4.847.561-6.161C.88 1.62 1.62.88 2.768.561 3.367.395 4.464.281 6.148.204 7.806.115 9.324.077 10.727.077L12.755 0c5.344 0 8.674.204 9.987.561 1.148.319 1.888 1.059 2.207 2.207Z" />
    </svg>
  );
}

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
            <a href="#" aria-label="Instagram"><InstagramIcon /></a>
            <a href="#" aria-label="Facebook"><FacebookIcon /></a>
            <a href="#" aria-label="LinkedIn"><LinkedInIcon /></a>
            <a href="#" aria-label="X"><XIcon /></a>
            <a href="#" aria-label="YouTube"><YouTubeIcon /></a>
          </div>

          <div className="site-footer-divider" />
          <small>CC 2026 Lehenga Rental. All rights reserved</small>
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

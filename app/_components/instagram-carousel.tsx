const PROFILE_URL = "https://www.instagram.com/bridalzone_/?hl=en";
const BRIDAL_ZONE_REELS = [
  "https://www.instagram.com/reel/DXODlYuk1f4/",
  "https://www.instagram.com/reel/DAN91WLO0IU/",
  "https://www.instagram.com/reel/Da0RdXezYFv/",
  "https://www.instagram.com/reel/DazOpV2zKTT/",
  "https://www.instagram.com/reel/DayyLcYTdvO/",
  "https://www.instagram.com/reel/Daw5PMSPFYW/",
  "https://www.instagram.com/reel/DawxVFMTKme/",
  "https://www.instagram.com/reel/DauIGWOTpsc/",
  "https://www.instagram.com/reel/DatkeR2TmV0/",
  "https://www.instagram.com/reel/DasFLOjz0A9/",
  "https://www.instagram.com/reel/DapPf_LOcLx/",
  "https://www.instagram.com/reel/DamtOQIT0mN/",
] as const;

function getInstagramItems() {
  const configured = process.env.NEXT_PUBLIC_INSTAGRAM_POST_URLS?.split(",").map((url) => url.trim()).filter(Boolean) ?? [];
  return configured.length ? configured : [...BRIDAL_ZONE_REELS];
}

export function InstagramCarousel() {
  const items = getInstagramItems();
  const loop = [...items, ...items];
  return <section className="instagram-section" aria-labelledby="instagram-title">
    <div className="section-row instagram-heading"><div><span className="instagram-kicker">@bridalzone_</span><h2 id="instagram-title">Follow our bridal stories</h2></div><a className="discover-button" href={PROFILE_URL} target="_blank" rel="noreferrer">View Instagram</a></div>
    <div className="instagram-marquee"><div className="instagram-track">
      {loop.map((url, index) => {
        const isPost = /instagram\.com\/(?:p|reel|reels)\//.test(url);
        return <a key={`${url}-${index}`} className="instagram-card" href={url} target="_blank" rel="noreferrer" aria-label={`Open Bridal Zone Instagram ${isPost ? "post" : "profile"}`}>
          {isPost ? <iframe title={`Bridal Zone Instagram post ${index + 1}`} src={`${url.replace(/\?.*$/, "").replace(/\/$/, "")}/embed`} loading="lazy" tabIndex={-1} /> : <div className="instagram-placeholder"><span className="instagram-mark">◎</span><strong>Bridal Zone</strong><small>Reels · Bridal looks · New arrivals</small><span>Watch on Instagram →</span></div>}
        </a>;
      })}
    </div></div>
  </section>;
}

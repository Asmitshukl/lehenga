import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

export function StoreBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="shopall-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="breadcrumb-item">
            {item.href && !isLast ? (
              <Link href={item.href} className="breadcrumb-muted">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "breadcrumb-current" : "breadcrumb-muted"}>{item.label}</span>
            )}
            {!isLast ? (
              <span className="breadcrumb-sep" aria-hidden="true">
                /
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}

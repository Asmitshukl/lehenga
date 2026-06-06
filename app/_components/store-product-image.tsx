"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

import { getCatalogImageUrl } from "../_lib/catalog-image-url";

export function StoreProductImage({
  image,
  name,
  className,
}: {
  image: string | StaticImageData;
  name: string;
  className: string;
}) {
  const remoteSource = typeof image === "string" ? getCatalogImageUrl(image) : null;
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (typeof image === "string") {
    if (remoteSource === failedSource) {
      return (
        <div className={`${className} product-image-error`} role="img" aria-label={`${name} image unavailable`}>
          <span>Image unavailable</span>
        </div>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={remoteSource ?? image}
        alt={name}
        className={className}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSource(remoteSource)}
      />
    );
  }

  return <Image src={image} alt={name} className={className} />;
}

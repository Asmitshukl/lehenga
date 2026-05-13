"use client";

import Image, { type StaticImageData } from "next/image";

export function StoreProductImage({
  image,
  name,
  className,
}: {
  image: string | StaticImageData;
  name: string;
  className: string;
}) {
  if (typeof image === "string") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name} className={className} />
    );
  }

  return <Image src={image} alt={name} className={className} />;
}

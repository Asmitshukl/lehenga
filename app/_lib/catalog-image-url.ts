function getCloudFrontBaseUrl() {
  return process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN?.replace(/\/$/, "");
}

export function getCatalogImageUrl(imageUrl: string) {
  const cloudFrontBaseUrl = getCloudFrontBaseUrl();

  if (
    !cloudFrontBaseUrl ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith(`${cloudFrontBaseUrl}/`) ||
    imageUrl === cloudFrontBaseUrl
  ) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);

    if (url.hostname.includes(".s3.") || url.hostname.endsWith(".s3.amazonaws.com")) {
      return `${cloudFrontBaseUrl}${url.pathname}`;
    }

    if (url.hostname.startsWith("s3.") || url.hostname === "s3.amazonaws.com") {
      const [, , ...keyParts] = url.pathname.split("/");

      return keyParts.length > 0 ? `${cloudFrontBaseUrl}/${keyParts.join("/")}` : imageUrl;
    }
  } catch {
    return imageUrl;
  }

  return imageUrl;
}

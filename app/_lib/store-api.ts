import { mockProducts } from "./mock-products";
import type {
  CustomerAuthResponse,
  CustomerProfile,
  ProductType,
  StoreCategory,
  StoreOrder,
  StoreProduct,
} from "./store-types";

function normalizeStoreApiBaseUrl(rawBaseUrl?: string) {
  return (rawBaseUrl ?? "http://localhost:5000/api").replace(/\/$/, "");
}

const STORE_API_BASE_URL = normalizeStoreApiBaseUrl(process.env.NEXT_PUBLIC_LEHENGA_API_URL);

function getStoreApiUrls(path: string) {
  const candidates = new Set<string>();
  const pushBaseVariants = (baseUrl: string) => {
    candidates.add(`${baseUrl}${path}`);

    if (baseUrl.endsWith("/api")) {
      candidates.add(`${baseUrl}/public${path}`);
    }
  };

  pushBaseVariants(STORE_API_BASE_URL);

  if (!process.env.NEXT_PUBLIC_LEHENGA_API_URL) {
    pushBaseVariants("http://localhost:5000/api");
    pushBaseVariants("http://localhost:4000/api");
  }

  return [...candidates];
}

type ApiCategoryRef = {
  id: string;
  name: string;
  slug: string;
};

type ApiLehenga = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  shortDescription?: string | null;
  description?: string | null;
  designer?: string | null;
  color?: string | null;
  fabric?: string | null;
  occasion?: string | null;
  rentalPricePerDay: string | number;
  securityDeposit?: string | number | null;
  originalPrice?: string | number | null;
  minimumRentalDays?: number | null;
  category?: ApiCategoryRef | null;
  images: Array<{ imageUrl: string; altText?: string | null }>;
  sizes: Array<{
    id: string;
    sizeLabel: string;
    quantityTotal: number;
    quantityReserved: number;
  }>;
};

type ApiJewellery = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  shortDescription?: string | null;
  description?: string | null;
  type?: string | null;
  material?: string | null;
  color?: string | null;
  finish?: string | null;
  stoneDetails?: string | null;
  occasion?: string | null;
  rentalPricePerDay: string | number;
  securityDeposit?: string | number | null;
  originalPrice?: string | number | null;
  minimumRentalDays?: number | null;
  stockQuantity?: number | null;
  category?: ApiCategoryRef | null;
  images: Array<{ imageUrl: string; altText?: string | null }>;
};

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  isFeatured?: boolean;
  description?: string | null;
  lehengas: ApiLehenga[];
  jewelleryItems: ApiJewellery[];
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  token?: string | null;
};

async function storeRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let lastErrorMessage = "Store request failed";

  for (const url of getStoreApiUrls(path)) {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    const rawText = await response.text();
    const json = rawText
      ? (JSON.parse(rawText) as { success?: boolean; data?: T; message?: string })
      : null;

    if (response.ok) {
      return (json?.data ?? json) as T;
    }

    lastErrorMessage = json?.message ?? "Store request failed";

    if (response.status !== 404) {
      throw new Error(lastErrorMessage);
    }
  }

  throw new Error(lastErrorMessage);
}

function getFallbackImage() {
  return mockProducts[0]?.image ?? "";
}

export function normalizeLehenga(item: ApiLehenga): StoreProduct {
  const images = item.images.map((image) => ({
    url: image.imageUrl,
    altText: image.altText ?? undefined,
  }));

  return {
    id: item.id,
    slug: item.slug,
    kind: "LEHENGA",
    name: item.name,
    createdAt: item.createdAt,
    rentalPricePerDay: Number(item.rentalPricePerDay),
    shortDescription: item.shortDescription ?? undefined,
    description: item.description ?? undefined,
    categoryId: item.category?.id,
    categoryName: item.category?.name ?? undefined,
    categorySlug: item.category?.slug ?? undefined,
    designer: item.designer ?? undefined,
    color: item.color ?? undefined,
    fabric: item.fabric ?? undefined,
    occasion: item.occasion ?? undefined,
    minimumRentalDays: item.minimumRentalDays ?? undefined,
    securityDeposit:
      item.securityDeposit !== null && item.securityDeposit !== undefined ? Number(item.securityDeposit) : undefined,
    originalPrice:
      item.originalPrice !== null && item.originalPrice !== undefined ? Number(item.originalPrice) : undefined,
    image: images[0]?.url ?? getFallbackImage(),
    images: images.length > 0 ? images : [{ url: getFallbackImage(), altText: item.name }],
    sizes: item.sizes.map((size) => ({
      id: size.id,
      sizeLabel: size.sizeLabel,
      quantityAvailable: Math.max(0, size.quantityTotal - size.quantityReserved),
    })),
  };
}

export function normalizeJewellery(item: ApiJewellery): StoreProduct {
  const images = item.images.map((image) => ({
    url: image.imageUrl,
    altText: image.altText ?? undefined,
  }));

  return {
    id: item.id,
    slug: item.slug,
    kind: "JEWELLERY",
    name: item.name,
    createdAt: item.createdAt,
    rentalPricePerDay: Number(item.rentalPricePerDay),
    shortDescription: item.shortDescription ?? undefined,
    description: item.description ?? undefined,
    categoryId: item.category?.id,
    categoryName: item.category?.name ?? undefined,
    categorySlug: item.category?.slug ?? undefined,
    color: item.color ?? undefined,
    occasion: item.occasion ?? undefined,
    material: item.material ?? undefined,
    finish: item.finish ?? undefined,
    stoneDetails: item.stoneDetails ?? undefined,
    typeLabel: item.type ?? undefined,
    minimumRentalDays: item.minimumRentalDays ?? undefined,
    securityDeposit:
      item.securityDeposit !== null && item.securityDeposit !== undefined ? Number(item.securityDeposit) : undefined,
    originalPrice:
      item.originalPrice !== null && item.originalPrice !== undefined ? Number(item.originalPrice) : undefined,
    stockQuantity: item.stockQuantity ?? undefined,
    image: images[0]?.url ?? getFallbackImage(),
    images: images.length > 0 ? images : [{ url: getFallbackImage(), altText: item.name }],
    sizes: [],
  };
}

function dedupeProducts(products: StoreProduct[]) {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = `${product.kind}:${product.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function fetchLiveProducts(): Promise<StoreProduct[]> {
  try {
    const products = await storeRequest<ApiLehenga[]>("/lehengas");
    return dedupeProducts(products.map(normalizeLehenga));
  } catch {
    return [];
  }
}

export async function fetchJewelleryProducts(): Promise<StoreProduct[]> {
  try {
    const products = await storeRequest<ApiJewellery[]>("/jewellery");
    return dedupeProducts(products.map(normalizeJewellery));
  } catch {
    return [];
  }
}

export async function fetchLehengaBySlug(slug: string): Promise<StoreProduct | null> {
  try {
    const product = await storeRequest<ApiLehenga>(`/lehengas/${slug}`);
    return normalizeLehenga(product);
  } catch {
    return null;
  }
}

export async function fetchJewelleryBySlug(slug: string): Promise<StoreProduct | null> {
  try {
    const product = await storeRequest<ApiJewellery>(`/jewellery/${slug}`);
    return normalizeJewellery(product);
  } catch {
    return null;
  }
}

export async function fetchCategories(limit?: number): Promise<StoreCategory[]> {
  try {
    const query = limit ? `?limit=${limit}` : "";
    const categories = await storeRequest<ApiCategory[]>(`/categories${query}`);

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      isFeatured: category.isFeatured ?? false,
      description: category.description ?? undefined,
      products: dedupeProducts([
        ...category.lehengas.map(normalizeLehenga),
        ...category.jewelleryItems.map(normalizeJewellery),
      ]),
    }));
  } catch {
    return [];
  }
}

export async function fetchFeaturedCategories(limit?: number): Promise<StoreCategory[]> {
  try {
    const params = new URLSearchParams({
      featured: "true",
    });

    if (limit) {
      params.set("limit", String(limit));
    }

    const categories = await storeRequest<ApiCategory[]>(`/categories?${params.toString()}`);

    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        isFeatured: category.isFeatured ?? false,
        description: category.description ?? undefined,
        products: dedupeProducts([
          ...category.lehengas.map(normalizeLehenga),
          ...category.jewelleryItems.map(normalizeJewellery),
        ]),
      }));
  } catch {
    return [];
  }
}

export async function fetchLatestProducts(limit = 4): Promise<StoreProduct[]> {
  try {
    const [lehengas, jewellery] = await Promise.all([fetchLiveProducts(), fetchJewelleryProducts()]);

    return [...lehengas, ...jewellery]
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

        return rightTime - leftTime;
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function signupCustomer(payload: {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  password: string;
}) {
  return storeRequest<CustomerAuthResponse>("/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export async function loginCustomer(payload: { phone: string; email: string; password: string }) {
  return storeRequest<CustomerAuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function fetchCustomerProfile(token: string) {
  return storeRequest<CustomerProfile>("/auth/me", {
    token,
  });
}

export async function fetchMyOrders(token: string) {
  return storeRequest<StoreOrder[]>("/orders/mine", {
    token,
  });
}

export async function createOrder(
  payload: {
    customerName?: string;
    customerEmail?: string;
    rentalStartDate: string;
    rentalEndDate: string;
    specialInstructions?: string;
    items: Array<
      | {
          itemType: Extract<ProductType, "LEHENGA">;
          lehengaId: string;
          lehengaSizeId?: string;
          quantity: number;
        }
      | {
          itemType: Extract<ProductType, "JEWELLERY">;
          jewelleryId: string;
          quantity: number;
        }
    >;
  },
  token: string,
) {
  return storeRequest<StoreOrder>("/orders", {
    method: "POST",
    body: payload,
    token,
  });
}

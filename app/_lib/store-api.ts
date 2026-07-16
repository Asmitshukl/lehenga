import { mockProducts } from "./mock-products";
import type {
  CheckoutOrderResponse,
  CustomerAuthResponse,
  CustomerProfile,
  LehengaMeasurements,
  OrderPreview,
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
  sku: string;
  createdAt: string;
  shortDescription?: string | null;
  description?: string | null;
  designer?: string | null;
  color?: string | null;
  fabric?: string | null;
  occasion?: string | null;
  rentalPricePerDay: string | number;
  discountPercent?: string | number | null;
  securityDeposit?: string | number | null;
  originalPrice?: string | number | null;
  minimumRentalDays?: number | null;
  category?: ApiCategoryRef | null;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    customer: {
      firstName: string;
      lastName?: string | null;
    };
  }>;
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
  sku: string;
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
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    customer: {
      firstName: string;
      lastName?: string | null;
    };
  }>;
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

type ApiOrderItem = {
  id: string;
  itemType: ProductType;
  productNameSnapshot: string;
  sizeLabelSnapshot?: string | null;
  quantity: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
  pricePerDay?: string;
  rentalDays?: number;
  lineTotal: string;
  depositAmount?: string;
  measurementUpper?: string | null;
  measurementChest?: string | null;
  measurementWaist?: string | null;
  measurementArmHole?: string | null;
  measurementMori?: string | null;
  measurementNotes?: string | null;
  lehenga?: {
    images?: Array<{ imageUrl: string; altText?: string | null }>;
  } | null;
  jewellery?: {
    images?: Array<{ imageUrl: string; altText?: string | null }>;
  } | null;
};

type ApiOrder = Omit<StoreOrder, "items"> & {
  items: ApiOrderItem[];
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
      cache: options.method && options.method !== "GET" ? "no-store" : "default",
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

function normalizeReviews(
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    customer: {
      firstName: string;
      lastName?: string | null;
    };
  }>,
) {
  return reviews?.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    customer: {
      firstName: review.customer.firstName,
      lastName: review.customer.lastName ?? undefined,
    },
  }));
}

function normalizeMeasurements(item: ApiOrderItem): LehengaMeasurements | undefined {
  const measurements: LehengaMeasurements = {
    upper: item.measurementUpper ?? undefined,
    chest: item.measurementChest ?? undefined,
    waist: item.measurementWaist ?? undefined,
    armHole: item.measurementArmHole ?? undefined,
    mori: item.measurementMori ?? undefined,
    notes: item.measurementNotes ?? undefined,
  };

  return Object.values(measurements).some((value) => typeof value === "string" && value.trim().length > 0)
    ? measurements
    : undefined;
}

function normalizeOrderItem(item: ApiOrderItem) {
  const productImage = item.lehenga?.images?.[0] ?? item.jewellery?.images?.[0] ?? null;

  return {
    id: item.id,
    itemType: item.itemType,
    productNameSnapshot: item.productNameSnapshot,
    sizeLabelSnapshot: item.sizeLabelSnapshot ?? undefined,
    quantity: item.quantity,
    rentalStartDate: item.rentalStartDate,
    rentalEndDate: item.rentalEndDate,
    pricePerDay: item.pricePerDay,
    rentalDays: item.rentalDays,
    lineTotal: item.lineTotal,
    depositAmount: item.depositAmount,
    imageUrl: productImage?.imageUrl,
    imageAltText: productImage?.altText ?? undefined,
    measurements: normalizeMeasurements(item),
  };
}

function normalizeOrder(order: ApiOrder): StoreOrder {
  return {
    ...order,
    items: order.items.map(normalizeOrderItem),
  };
}

export function normalizeLehenga(item: ApiLehenga): StoreProduct {
  const images = item.images.map((image) => ({
    url: image.imageUrl,
    altText: image.altText ?? undefined,
  }));
  const rentalPriceBeforeDiscount = Number(item.rentalPricePerDay);
  const discountPercent = Number(item.discountPercent ?? 0);
  const rentalPricePerDay = Math.max(
    0,
    rentalPriceBeforeDiscount - rentalPriceBeforeDiscount * (discountPercent / 100),
  );

  return {
    id: item.id,
    slug: item.slug,
    kind: "LEHENGA",
    name: item.name,
    sku: item.sku,
    createdAt: item.createdAt,
    rentalPricePerDay,
    rentalPriceBeforeDiscount,
    discountPercent,
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
    reviews: normalizeReviews(item.reviews),
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
    sku: item.sku,
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
    reviews: normalizeReviews(item.reviews),
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

export async function fetchLiveProductsOrThrow(): Promise<StoreProduct[]> {
  const products = await storeRequest<ApiLehenga[]>("/lehengas");
  return dedupeProducts(products.map(normalizeLehenga));
}

export async function fetchLiveProducts(): Promise<StoreProduct[]> {
  return fetchLiveProductsOrThrow().catch(() => []);
}

export async function fetchJewelleryProductsOrThrow(): Promise<StoreProduct[]> {
  const products = await storeRequest<ApiJewellery[]>("/jewellery");
  return dedupeProducts(products.map(normalizeJewellery));
}

export async function fetchJewelleryProducts(): Promise<StoreProduct[]> {
  return fetchJewelleryProductsOrThrow().catch(() => []);
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

function normalizeCategory(category: ApiCategory): StoreCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    isFeatured: category.isFeatured ?? false,
    description: category.description ?? undefined,
    products: dedupeProducts([
      ...category.lehengas.map(normalizeLehenga),
      ...category.jewelleryItems.map(normalizeJewellery),
    ]),
  };
}

export async function fetchCategoriesOrThrow(limit?: number): Promise<StoreCategory[]> {
  const query = limit ? `?limit=${limit}` : "";
  const categories = await storeRequest<ApiCategory[]>(`/categories${query}`);
  return categories.map(normalizeCategory);
}

export async function fetchCategories(limit?: number): Promise<StoreCategory[]> {
  return fetchCategoriesOrThrow(limit).catch(() => []);
}

export async function fetchFeaturedCategoriesOrThrow(limit?: number): Promise<StoreCategory[]> {
  const params = new URLSearchParams({
    featured: "true",
  });

  if (limit) {
    params.set("limit", String(limit));
  }

  const categories = await storeRequest<ApiCategory[]>(`/categories?${params.toString()}`);
  return categories.map(normalizeCategory);
}

export async function fetchFeaturedCategories(limit?: number): Promise<StoreCategory[]> {
  return fetchFeaturedCategoriesOrThrow(limit).catch(() => []);
}

export async function fetchLatestProductsOrThrow(limit = 4): Promise<StoreProduct[]> {
  const lehengas = await storeRequest<ApiLehenga[]>("/lehengas?latest=true");
  return lehengas.map(normalizeLehenga).slice(0, limit);
}

export async function fetchFeaturedLehengasOrThrow(limit?: number): Promise<StoreProduct[]> {
  const lehengas = await storeRequest<ApiLehenga[]>("/lehengas?featured=true");
  const products = lehengas.map(normalizeLehenga);

  return limit ? products.slice(0, limit) : products;
}

export async function fetchFeaturedLehengas(limit?: number): Promise<StoreProduct[]> {
  return fetchFeaturedLehengasOrThrow(limit).catch(() => []);
}

export async function fetchProductAvailability(input: {
  itemType: ProductType;
  productId: string;
  sizeId?: string;
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams({
    itemType: input.itemType,
    productId: input.productId,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  if (input.sizeId) {
    params.set("sizeId", input.sizeId);
  }

  return storeRequest<{ available: boolean; quantityAvailable: number }>(`/availability?${params.toString()}`);
}

export async function fetchLatestProducts(limit = 4): Promise<StoreProduct[]> {
  return fetchLatestProductsOrThrow(limit).catch(() => []);
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
  const orders = await storeRequest<ApiOrder[]>("/orders/mine", {
    token,
  });

  return orders.map(normalizeOrder);
}

export async function createOrder(
  payload: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    paymentMethod: "ONLINE" | "PICKUP";
    specialInstructions?: string;
    items: Array<
      | {
          itemType: Extract<ProductType, "LEHENGA">;
          lehengaId: string;
          lehengaSizeId?: string;
          quantity: number;
          rentalStartDate: string;
          rentalEndDate: string;
          measurements?: {
            upper?: string;
            chest?: string;
            waist?: string;
            armHole?: string;
            mori?: string;
            notes?: string;
          };
        }
      | {
          itemType: Extract<ProductType, "JEWELLERY">;
          jewelleryId: string;
          quantity: number;
          rentalStartDate: string;
          rentalEndDate: string;
        }
    >;
  },
  token?: string | null,
) {
  return storeRequest<CheckoutOrderResponse>("/orders", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function previewOrder(
  payload: {
    items: Array<
      | {
          itemType: Extract<ProductType, "LEHENGA">;
          lehengaId: string;
          lehengaSizeId?: string;
          quantity: number;
          rentalStartDate: string;
          rentalEndDate: string;
          measurements?: {
            upper?: string;
            chest?: string;
            waist?: string;
            armHole?: string;
            mori?: string;
            notes?: string;
          };
        }
      | {
          itemType: Extract<ProductType, "JEWELLERY">;
          jewelleryId: string;
          quantity: number;
          rentalStartDate: string;
          rentalEndDate: string;
        }
    >;
  },
  token?: string | null,
) {
  return storeRequest<OrderPreview>("/orders/preview", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function verifyRazorpayPayment(
  payload: {
    paymentAttemptId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
  token?: string | null,
) {
  const order = await storeRequest<ApiOrder>("/payments/razorpay/verify", {
    method: "POST",
    body: payload,
    token,
  });

  return normalizeOrder(order);
}

export async function cancelRazorpayPayment(
  payload: {
    paymentAttemptId: string;
  },
  token?: string | null,
) {
  return storeRequest<{ id: string; status: string }>("/payments/razorpay/cancel", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function submitProductReview(
  payload:
    | {
        itemType: Extract<ProductType, "LEHENGA">;
        lehengaId: string;
        rating: number;
        comment: string;
      }
    | {
        itemType: Extract<ProductType, "JEWELLERY">;
        jewelleryId: string;
        rating: number;
        comment: string;
      },
  token: string,
) {
  return storeRequest("/reviews", {
    method: "POST",
    body: payload,
    token,
  });
}

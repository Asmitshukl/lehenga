import type { StaticImageData } from "next/image";

export type ProductType = "LEHENGA" | "JEWELLERY";

export type ProductSize = {
  id: string;
  sizeLabel: string;
  quantityAvailable: number;
};

export type ProductImage = {
  url: string | StaticImageData;
  altText?: string;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName?: string | null;
  };
};

export type LehengaMeasurements = {
  upper?: string;
  chest?: string;
  waist?: string;
  armHole?: string;
  mori?: string;
  notes?: string;
};

export type StoreProduct = {
  id: string;
  slug: string;
  kind: ProductType;
  name: string;
  sku: string;
  createdAt?: string;
  rentalPricePerDay: number;
  rentalPriceBeforeDiscount?: number;
  discountPercent?: number;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  designer?: string;
  color?: string;
  fabric?: string;
  occasion?: string;
  material?: string;
  finish?: string;
  stoneDetails?: string;
  typeLabel?: string;
  minimumRentalDays?: number;
  securityDeposit?: number;
  originalPrice?: number;
  stockQuantity?: number;
  image: string | StaticImageData;
  images: ProductImage[];
  sizes: ProductSize[];
  reviews?: ProductReview[];
  isMock?: boolean;
};

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isFeatured?: boolean;
  products: StoreProduct[];
};

export type CartItem = {
  cartLineId: string;
  productId: string;
  kind: ProductType;
  slug: string;
  name: string;
  sku?: string;
  image: string | StaticImageData;
  rentalPricePerDay: number;
  securityDeposit?: number;
  quantity: number;
  selectedSizeId?: string;
  selectedSizeLabel?: string;
  availableSizes: ProductSize[];
  rentalStartDate?: string;
  rentalEndDate?: string;
  measurements?: LehengaMeasurements;
  isMock?: boolean;
};

export type CustomerProfile = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone: string;
};

export type CustomerAuthResponse = {
  customer: CustomerProfile;
  token: string;
};

export type StoreOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  rentalStartDate: string;
  rentalEndDate: string;
  pickupDate?: string | null;
  returnDate?: string | null;
  subtotalAmount: string;
  securityDeposit: string;
  totalAmount: string;
  amountPaid?: string;
  amountDueAtPickup?: string;
  depositRefundStatus?: string;
  depositRefundedAmount?: string;
  depositRefundedAt?: string | null;
  specialInstructions?: string | null;
  createdAt?: string;
  customer?: {
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  pickupLocation?: {
    name: string;
    phone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    pickupNotes?: string | null;
  };
  items: Array<{
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
    imageUrl?: string;
    imageAltText?: string;
    measurements?: LehengaMeasurements | null;
  }>;
};

export type OrderPreview = {
  rentalStartDate: string;
  rentalEndDate: string;
  subtotalAmount: number;
  securityDeposit: number;
  totalAmount: number;
  items: Array<{
    itemType: ProductType;
    productNameSnapshot: string;
    quantity: number;
    rentalStartDate: string;
    rentalEndDate: string;
    rentalDays: number;
    lineTotal: number;
    depositAmount: number;
    sizeLabelSnapshot?: string;
  }>;
};

export type CheckoutOrderResponse = {
  paymentAttempt: {
    id: string;
    expiresAt: string;
  };
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
    keyId: string;
    name: string;
    description: string;
  };
};

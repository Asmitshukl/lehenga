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

export type StoreProduct = {
  id: string;
  slug: string;
  kind: ProductType;
  name: string;
  createdAt?: string;
  rentalPricePerDay: number;
  shortDescription?: string;
  description?: string;
  collectionId?: string;
  collectionName?: string;
  collectionSlug?: string;
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
  isMock?: boolean;
};

export type StoreCollection = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isFeatured?: boolean;
  products: StoreProduct[];
};

export type CartItem = {
  productId: string;
  kind: ProductType;
  slug: string;
  name: string;
  image: string | StaticImageData;
  rentalPricePerDay: number;
  quantity: number;
  selectedSizeId?: string;
  selectedSizeLabel?: string;
  availableSizes: ProductSize[];
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
  rentalStartDate: string;
  rentalEndDate: string;
  subtotalAmount: string;
  securityDeposit: string;
  totalAmount: string;
  items: Array<{
    id: string;
    itemType: ProductType;
    productNameSnapshot: string;
    sizeLabelSnapshot?: string | null;
    quantity: number;
    lineTotal: string;
  }>;
};

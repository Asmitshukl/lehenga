import productFour from "@/photo/OrsgG1MS5sHp1VE82UxEWEomE.webp";
import productOne from "@/photo/KFTRQLSObbhVxYVTVOVmxytfJfw.webp";
import productThree from "@/photo/mLf8sfm5tTlilDeyzxjuV4zIU.webp";
import productTwo from "@/photo/lns3AtbITTJO3JYlQRoCSbZc.webp";

import type { StoreProduct } from "./store-types";

export const mockProducts: StoreProduct[] = [
  {
    id: "mock-1",
    slug: "mock-lehenga-1",
    kind: "LEHENGA",
    name: "Lehenga 1",
    sku: "PREVIEW-001",
    rentalPricePerDay: 6000,
    image: productOne,
    images: [{ url: productOne, altText: "Lehenga 1" }],
    sizes: [],
    isMock: true,
  },
  {
    id: "mock-2",
    slug: "mock-lehenga-2",
    kind: "LEHENGA",
    name: "Lehenga 2",
    sku: "PREVIEW-002",
    rentalPricePerDay: 6000,
    image: productTwo,
    images: [{ url: productTwo, altText: "Lehenga 2" }],
    sizes: [],
    isMock: true,
  },
  {
    id: "mock-3",
    slug: "mock-lehenga-3",
    kind: "LEHENGA",
    name: "Lehenga 3",
    sku: "PREVIEW-003",
    rentalPricePerDay: 6000,
    image: productThree,
    images: [{ url: productThree, altText: "Lehenga 3" }],
    sizes: [],
    isMock: true,
  },
  {
    id: "mock-4",
    slug: "mock-lehenga-4",
    kind: "LEHENGA",
    name: "Lehenga 4",
    sku: "PREVIEW-004",
    rentalPricePerDay: 6000,
    image: productFour,
    images: [{ url: productFour, altText: "Lehenga 4" }],
    sizes: [],
    isMock: true,
  },
];

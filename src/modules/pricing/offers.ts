import type { ComponentId } from "@/modules/catalog/types";

import type { Money } from "./money";

export type Seller = {
  id: string;
  name: string;
};

export type ComponentOffer = {
  id: string;
  componentId: ComponentId;
  sellerId: Seller["id"];
  price: Money;
};

export const sellers = [
  {
    id: "seller-demo-a",
    name: "Demo Hardware",
  },
  {
    id: "seller-demo-b",
    name: "PC Parts Demo",
  },
  {
    id: "seller-import",
    name: "Import Demo",
  },
] as const satisfies readonly Seller[];

export const componentOffers = [
  {
    id: "offer-ars-cpu-7600-a",
    componentId: "cpu-amd-ryzen-5-7600",
    sellerId: "seller-demo-a",
    price: { amountMinor: 28000000, currency: "ARS" },
  },
  {
    id: "offer-ars-cpu-7600-b",
    componentId: "cpu-amd-ryzen-5-7600",
    sellerId: "seller-demo-b",
    price: { amountMinor: 26500000, currency: "ARS" },
  },
  {
    id: "offer-usd-cpu-7600",
    componentId: "cpu-amd-ryzen-5-7600",
    sellerId: "seller-import",
    price: { amountMinor: 19999, currency: "USD" },
  },
  {
    id: "offer-ars-motherboard-b650",
    componentId: "motherboard-msi-b650-tomahawk-wifi",
    sellerId: "seller-demo-a",
    price: { amountMinor: 36500000, currency: "ARS" },
  },
  {
    id: "offer-ars-gpu-5070-a",
    componentId: "gpu-asus-prime-rtx-5070-oc",
    sellerId: "seller-demo-a",
    price: { amountMinor: 92000000, currency: "ARS" },
  },
  {
    id: "offer-ars-gpu-5070-b",
    componentId: "gpu-asus-prime-rtx-5070-oc",
    sellerId: "seller-demo-b",
    price: { amountMinor: 92000000, currency: "ARS" },
  },
  {
    id: "offer-ars-memory-ripjaws",
    componentId: "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    sellerId: "seller-demo-a",
    price: { amountMinor: 14500000, currency: "ARS" },
  },
  {
    id: "offer-ars-psu-seasonic",
    componentId: "psu-seasonic-focus-gx-750w",
    sellerId: "seller-demo-b",
    price: { amountMinor: 22000000, currency: "ARS" },
  },
  {
    id: "offer-ars-case-4000d",
    componentId: "case-corsair-4000d-airflow",
    sellerId: "seller-demo-a",
    price: { amountMinor: 18500000, currency: "ARS" },
  },
  {
    id: "offer-ars-cooler-ag400",
    componentId: "cpu-cooler-deepcool-ag400",
    sellerId: "seller-demo-b",
    price: { amountMinor: 6200000, currency: "ARS" },
  },
  {
    id: "offer-usd-gpu-4060",
    componentId: "gpu-msi-rtx-4060-ventus-2x",
    sellerId: "seller-import",
    price: { amountMinor: 29999, currency: "USD" },
  },
] as const satisfies readonly ComponentOffer[];

export function getAllSellers() {
  return sellers;
}

export function getAllComponentOffers() {
  return componentOffers;
}

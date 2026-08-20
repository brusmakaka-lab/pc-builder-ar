import type {
  ComponentReferenceMap,
  ExternalOffer,
  OfferSource,
  SellerReferenceMap,
} from "./types";

export const demoOfferSourceId = "demo-offer-source";

const demoExternalOffers = [
  {
    externalId: "demo-offer-7600",
    sourceId: demoOfferSourceId,
    sellerExternalId: "demo-hardware-external",
    componentReference: "amd-ryzen-5-7600",
    price: { amountMinor: 27500000, currency: "ARS" },
    observedAt: "2026-08-20T06:00:00.000Z",
  },
  {
    externalId: "demo-offer-unknown-component",
    sourceId: demoOfferSourceId,
    sellerExternalId: "demo-hardware-external",
    componentReference: "unknown-component-reference",
    price: { amountMinor: 1000000, currency: "ARS" },
    observedAt: "2026-08-20T06:05:00.000Z",
  },
  {
    externalId: "demo-offer-unknown-seller",
    sourceId: demoOfferSourceId,
    sellerExternalId: "unknown-seller-external",
    componentReference: "msi-b650-tomahawk-wifi",
    price: { amountMinor: 36000000, currency: "ARS" },
    observedAt: "2026-08-20T06:10:00.000Z",
  },
  {
    externalId: "demo-offer-invalid-price",
    sourceId: demoOfferSourceId,
    sellerExternalId: "pc-parts-demo-external",
    componentReference: "seasonic-focus-gx-750w",
    price: { amountMinor: -1, currency: "ARS" },
    observedAt: "2026-08-20T06:15:00.000Z",
  },
  {
    externalId: "demo-offer-7600",
    sourceId: demoOfferSourceId,
    sellerExternalId: "demo-hardware-external",
    componentReference: "amd-ryzen-5-7600",
    price: { amountMinor: 27400000, currency: "ARS" },
    observedAt: "2026-08-20T06:20:00.000Z",
  },
  {
    externalId: "demo-offer-4060-usd",
    sourceId: demoOfferSourceId,
    sellerExternalId: "import-demo-external",
    componentReference: "msi-rtx-4060-ventus-2x",
    price: { amountMinor: 28999, currency: "USD" },
    observedAt: "2026-08-20T06:25:00.000Z",
  },
] as const satisfies readonly ExternalOffer[];

export const demoComponentReferenceMap = {
  "amd-ryzen-5-7600": "cpu-amd-ryzen-5-7600",
  "corsair-4000d-airflow": "case-corsair-4000d-airflow",
  "deepcool-ag400": "cpu-cooler-deepcool-ag400",
  "gskill-ripjaws-s5-32gb-ddr5-6000":
    "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
  "msi-b650-tomahawk-wifi": "motherboard-msi-b650-tomahawk-wifi",
  "msi-rtx-4060-ventus-2x": "gpu-msi-rtx-4060-ventus-2x",
  "seasonic-focus-gx-750w": "psu-seasonic-focus-gx-750w",
} as const satisfies ComponentReferenceMap;

export const demoSellerReferenceMap = {
  "demo-hardware-external": "seller-demo-a",
  "import-demo-external": "seller-import",
  "one-stop-demo-external": "seller-one-stop",
  "pc-parts-demo-external": "seller-demo-b",
} as const satisfies SellerReferenceMap;

export const demoOfferSource: OfferSource = {
  id: demoOfferSourceId,
  async load() {
    return demoExternalOffers.map((offer) => ({
      ...offer,
      price: { ...offer.price },
    }));
  },
};

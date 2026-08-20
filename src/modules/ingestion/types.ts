import type { ComponentId } from "@/modules/catalog/types";
import type { Currency } from "@/modules/pricing/money";
import type { ComponentOffer, Seller } from "@/modules/pricing/offers";

export type OfferSource = {
  readonly id: string;
  load(): Promise<ExternalOffer[]>;
};

export type ExternalOffer = {
  externalId: string;
  sourceId: string;
  sellerExternalId: string;
  componentReference: string;
  price: {
    amountMinor: number;
    currency: string;
  };
  observedAt: string;
};

export type OfferProvenance = {
  sourceId: string;
  externalOfferId: string;
  observedAt: string;
};

export type IngestedComponentOffer = {
  offer: ComponentOffer;
  provenance: OfferProvenance;
};

export type ComponentReferenceMap = Readonly<Record<string, ComponentId>>;
export type SellerReferenceMap = Readonly<Record<string, Seller["id"]>>;

export type OfferRejectionCode =
  | "duplicate-external-offer"
  | "invalid-external-id"
  | "invalid-observed-at"
  | "invalid-price"
  | "invalid-source-id"
  | "unknown-component"
  | "unknown-seller"
  | "unsupported-currency";

export type OfferRejectionReason = {
  code: OfferRejectionCode;
  message: string;
};

export type RejectedExternalOffer = {
  externalOffer: ExternalOffer;
  reason: OfferRejectionReason;
};

export type OfferNormalizationResult =
  | {
      status: "accepted";
      offer: ComponentOffer;
      provenance: OfferProvenance;
    }
  | {
      status: "rejected";
      externalOffer: ExternalOffer;
      reason: OfferRejectionReason;
    };

export type OfferIngestionResult = {
  accepted: IngestedComponentOffer[];
  rejected: RejectedExternalOffer[];
};

export function isSupportedCurrency(currency: string): currency is Currency {
  return currency === "ARS" || currency === "USD";
}

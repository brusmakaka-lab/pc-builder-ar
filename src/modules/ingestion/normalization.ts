import type { ComponentOffer } from "@/modules/pricing/offers";

import {
  isSupportedCurrency,
  type ComponentReferenceMap,
  type ExternalOffer,
  type OfferIngestionResult,
  type OfferNormalizationResult,
  type OfferRejectionCode,
  type SellerReferenceMap,
} from "./types";

export function normalizeExternalOffer(
  externalOffer: ExternalOffer,
  componentMapping: ComponentReferenceMap,
  sellerMapping: SellerReferenceMap,
): OfferNormalizationResult {
  if (!externalOffer.externalId.trim()) {
    return rejectExternalOffer(externalOffer, "invalid-external-id");
  }

  if (!externalOffer.sourceId.trim()) {
    return rejectExternalOffer(externalOffer, "invalid-source-id");
  }

  const componentId = componentMapping[externalOffer.componentReference];

  if (!componentId) {
    return rejectExternalOffer(externalOffer, "unknown-component");
  }

  const sellerId = sellerMapping[externalOffer.sellerExternalId];

  if (!sellerId) {
    return rejectExternalOffer(externalOffer, "unknown-seller");
  }

  if (!isValidAmountMinor(externalOffer.price.amountMinor)) {
    return rejectExternalOffer(externalOffer, "invalid-price");
  }

  if (!isSupportedCurrency(externalOffer.price.currency)) {
    return rejectExternalOffer(externalOffer, "unsupported-currency");
  }

  if (!isValidObservedAt(externalOffer.observedAt)) {
    return rejectExternalOffer(externalOffer, "invalid-observed-at");
  }

  const offer: ComponentOffer = {
    id: createIngestedOfferId(externalOffer.sourceId, externalOffer.externalId),
    componentId,
    sellerId,
    price: {
      amountMinor: externalOffer.price.amountMinor,
      currency: externalOffer.price.currency,
    },
  };

  return {
    status: "accepted",
    offer,
    provenance: {
      sourceId: externalOffer.sourceId,
      externalOfferId: externalOffer.externalId,
      observedAt: externalOffer.observedAt,
    },
  };
}

export function normalizeExternalOffers(
  externalOffers: readonly ExternalOffer[],
  componentMapping: ComponentReferenceMap,
  sellerMapping: SellerReferenceMap,
): OfferIngestionResult {
  const accepted: OfferIngestionResult["accepted"] = [];
  const rejected: OfferIngestionResult["rejected"] = [];
  const acceptedExternalKeys = new Set<string>();

  for (const externalOffer of externalOffers) {
    const result = normalizeExternalOffer(
      externalOffer,
      componentMapping,
      sellerMapping,
    );

    if (result.status === "rejected") {
      rejected.push({
        externalOffer: result.externalOffer,
        reason: result.reason,
      });
      continue;
    }

    const externalKey = createExternalOfferKey(
      result.provenance.sourceId,
      result.provenance.externalOfferId,
    );

    if (acceptedExternalKeys.has(externalKey)) {
      rejected.push({
        externalOffer,
        reason: createRejectionReason("duplicate-external-offer"),
      });
      continue;
    }

    acceptedExternalKeys.add(externalKey);
    accepted.push({
      offer: result.offer,
      provenance: result.provenance,
    });
  }

  return { accepted, rejected };
}

function createIngestedOfferId(sourceId: string, externalOfferId: string) {
  return `external:${sourceId}:${externalOfferId}`;
}

function createExternalOfferKey(sourceId: string, externalOfferId: string) {
  return `${sourceId}\u0000${externalOfferId}`;
}

function isValidAmountMinor(amountMinor: number) {
  return Number.isInteger(amountMinor) && amountMinor >= 0;
}

function isValidObservedAt(observedAt: string) {
  if (!observedAt.endsWith("Z")) {
    return false;
  }

  const parsedDate = new Date(observedAt);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString() === observedAt
  );
}

function rejectExternalOffer(
  externalOffer: ExternalOffer,
  code: OfferRejectionCode,
): OfferNormalizationResult {
  return {
    status: "rejected",
    externalOffer,
    reason: createRejectionReason(code),
  };
}

function createRejectionReason(code: OfferRejectionCode) {
  return {
    code,
    message: getRejectionMessage(code),
  };
}

function getRejectionMessage(code: OfferRejectionCode) {
  const messages: Record<OfferRejectionCode, string> = {
    "duplicate-external-offer":
      "An accepted offer from this source with this external id already exists in the batch.",
    "invalid-external-id": "External offer id is empty.",
    "invalid-observed-at": "Observed timestamp is not a valid UTC ISO string.",
    "invalid-price": "Price amountMinor must be a non-negative integer.",
    "invalid-source-id": "Source id is empty.",
    "unknown-component": "Component reference is not mapped to a known component.",
    "unknown-seller": "Seller external id is not mapped to a known seller.",
    "unsupported-currency": "Currency is not supported.",
  };

  return messages[code];
}

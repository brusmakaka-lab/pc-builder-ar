import type { ComponentId } from "@/modules/catalog/types";
import type { PcBuild } from "@/modules/builds/types";

import { addMoneyForCurrency, type Currency, type Money } from "./money";
import type { ComponentOffer, Seller } from "./offers";

export type BuildPricingStatus = "unpriced" | "partial" | "complete";
export type PurchaseStrategy = "mixed-cheapest" | "single-seller";

export type BuildPricingSlot =
  | "cpu"
  | "motherboard"
  | "gpu"
  | "memoryKit"
  | "psu"
  | "case"
  | "cpuCooler";

export type BuildPricingItem = {
  slot: BuildPricingSlot;
  componentId: ComponentId;
  offerId: ComponentOffer["id"];
  sellerId: ComponentOffer["sellerId"];
  price: Money;
};

export type BuildPricing = {
  currency: Currency;
  items: BuildPricingItem[];
  pricedSubtotal: Money;
  total: Money | null;
  pricedComponentCount: number;
  missingPriceComponentIds: ComponentId[];
  status: BuildPricingStatus;
};

export type SellerBuildPricing = BuildPricing & {
  strategy: "single-seller";
  sellerId: Seller["id"];
  sellerName: Seller["name"] | null;
  differenceFromMixed: Money | null;
};

export type BuildPurchaseComparison = {
  currency: Currency;
  mixedCheapest: BuildPricing & { strategy: "mixed-cheapest" };
  singleSellerOptions: SellerBuildPricing[];
  cheapestCompleteSingleSeller: SellerBuildPricing | null;
};

const BUILD_PRICING_SLOTS = [
  ["cpu", "cpuId"],
  ["motherboard", "motherboardId"],
  ["gpu", "gpuId"],
  ["memoryKit", "memoryKitId"],
  ["psu", "psuId"],
  ["case", "caseId"],
  ["cpuCooler", "cpuCoolerId"],
] as const satisfies readonly [BuildPricingSlot, keyof PcBuild][];

export function selectOfferForComponent(
  componentId: ComponentId,
  offers: readonly ComponentOffer[],
  currency: Currency,
): ComponentOffer | null {
  const matchingOffers = [
    ...offers.filter(
      (offer) =>
        offer.componentId === componentId && offer.price.currency === currency,
    ),
  ].sort((left, right) => {
    const priceDifference = left.price.amountMinor - right.price.amountMinor;

    if (priceDifference !== 0) {
      return priceDifference;
    }

    return left.id.localeCompare(right.id);
  });

  return matchingOffers[0] ?? null;
}

export function evaluateBuildPricing(
  build: PcBuild,
  offers: readonly ComponentOffer[],
  currency: Currency,
): BuildPricing {
  const items: BuildPricingItem[] = [];
  const missingPriceComponentIds: ComponentId[] = [];

  for (const [slot, buildKey] of BUILD_PRICING_SLOTS) {
    const componentId = build[buildKey];

    if (!componentId) {
      continue;
    }

    const offer = selectOfferForComponent(componentId, offers, currency);

    if (!offer) {
      missingPriceComponentIds.push(componentId);
      continue;
    }

    items.push({
      slot,
      componentId,
      offerId: offer.id,
      sellerId: offer.sellerId,
      price: offer.price,
    });
  }

  const selectedComponentCount = items.length + missingPriceComponentIds.length;
  const pricedSubtotalResult = addMoneyForCurrency(
    items.map((item) => item.price),
    currency,
  );

  if (!pricedSubtotalResult.ok) {
    throw new Error("Build pricing selected offers with mixed currencies.");
  }

  const status = getBuildPricingStatus(
    selectedComponentCount,
    items.length,
    missingPriceComponentIds.length,
  );

  return {
    currency,
    items,
    pricedSubtotal: pricedSubtotalResult.total,
    total: status === "complete" ? pricedSubtotalResult.total : null,
    pricedComponentCount: items.length,
    missingPriceComponentIds,
    status,
  };
}

export function evaluateSellerBuildPricing(
  build: PcBuild,
  offers: readonly ComponentOffer[],
  seller: Seller,
  currency: Currency,
  mixedCheapestTotal: Money | null = null,
): SellerBuildPricing {
  const sellerOffers = offers.filter((offer) => offer.sellerId === seller.id);
  const pricing = evaluateBuildPricing(build, sellerOffers, currency);

  return {
    ...pricing,
    strategy: "single-seller",
    sellerId: seller.id,
    sellerName: seller.name,
    differenceFromMixed: getDifferenceFromMixed(pricing.total, mixedCheapestTotal),
  };
}

export function evaluateBuildPurchaseComparison(
  build: PcBuild,
  offers: readonly ComponentOffer[],
  sellers: readonly Seller[],
  currency: Currency,
): BuildPurchaseComparison {
  const mixedCheapest = {
    ...evaluateBuildPricing(build, offers, currency),
    strategy: "mixed-cheapest" as const,
  };
  const selectedComponentIds = getSelectedComponentIds(build);

  if (selectedComponentIds.length === 0) {
    return {
      currency,
      mixedCheapest,
      singleSellerOptions: [],
      cheapestCompleteSingleSeller: null,
    };
  }

  const relevantSellers = getRelevantSellers(
    selectedComponentIds,
    offers,
    sellers,
    currency,
  );
  const singleSellerOptions = relevantSellers.map((seller) =>
    evaluateSellerBuildPricing(
      build,
      offers,
      seller,
      currency,
      mixedCheapest.total,
    ),
  );

  return {
    currency,
    mixedCheapest,
    singleSellerOptions,
    cheapestCompleteSingleSeller:
      getCheapestCompleteSingleSeller(singleSellerOptions),
  };
}

function getBuildPricingStatus(
  selectedComponentCount: number,
  pricedComponentCount: number,
  missingPriceComponentCount: number,
): BuildPricingStatus {
  if (selectedComponentCount === 0) {
    return "complete";
  }

  if (pricedComponentCount === 0 && missingPriceComponentCount > 0) {
    return "unpriced";
  }

  if (missingPriceComponentCount > 0) {
    return "partial";
  }

  return "complete";
}

function getSelectedComponentIds(build: PcBuild): ComponentId[] {
  return BUILD_PRICING_SLOTS.flatMap(([, buildKey]) => {
    const componentId = build[buildKey];

    return componentId ? [componentId] : [];
  });
}

function getRelevantSellers(
  selectedComponentIds: readonly ComponentId[],
  offers: readonly ComponentOffer[],
  sellers: readonly Seller[],
  currency: Currency,
) {
  const sellerById = new Map(sellers.map((seller) => [seller.id, seller]));
  const relevantSellerIds = new Set(
    offers
      .filter(
        (offer) =>
          offer.price.currency === currency &&
          selectedComponentIds.includes(offer.componentId),
      )
      .map((offer) => offer.sellerId),
  );

  return [...relevantSellerIds]
    .map(
      (sellerId): Seller =>
        sellerById.get(sellerId) ?? { id: sellerId, name: sellerId },
    )
    .sort((left, right) => {
      const nameComparison = left.name.localeCompare(right.name);

      if (nameComparison !== 0) {
        return nameComparison;
      }

      return left.id.localeCompare(right.id);
    });
}

function getCheapestCompleteSingleSeller(
  sellerPricings: readonly SellerBuildPricing[],
): SellerBuildPricing | null {
  const completePricings = sellerPricings.filter(
    (pricing) => pricing.status === "complete" && pricing.total,
  );

  if (completePricings.length === 0) {
    return null;
  }

  const [cheapestComplete] = [...completePricings].sort((left, right) => {
    const totalDifference =
      (left.total?.amountMinor ?? 0) - (right.total?.amountMinor ?? 0);

    if (totalDifference !== 0) {
      return totalDifference;
    }

    return left.sellerId.localeCompare(right.sellerId);
  });

  return cheapestComplete ?? null;
}

function getDifferenceFromMixed(
  sellerTotal: Money | null,
  mixedCheapestTotal: Money | null,
): Money | null {
  if (!sellerTotal || !mixedCheapestTotal) {
    return null;
  }

  if (sellerTotal.currency !== mixedCheapestTotal.currency) {
    return null;
  }

  return {
    amountMinor: sellerTotal.amountMinor - mixedCheapestTotal.amountMinor,
    currency: sellerTotal.currency,
  };
}

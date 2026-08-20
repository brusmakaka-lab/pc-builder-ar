import type { ComponentId } from "@/modules/catalog/types";
import type { PcBuild } from "@/modules/builds/types";

import { addMoneyForCurrency, type Currency, type Money } from "./money";
import type { ComponentOffer, Seller, SellerShippingQuote } from "./offers";

export type BuildPricingStatus = "unpriced" | "partial" | "complete";
export type PurchaseStrategy = "mixed-cheapest" | "single-seller";
export type ShippingStatus = "known" | "unknown";

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

export type PurchaseCost = {
  componentSubtotal: Money;
  shippingTotal: Money | null;
  effectiveTotal: Money | null;
  shippingStatus: ShippingStatus;
};

export type MixedCheapestBuildPricing = BuildPricing & {
  strategy: "mixed-cheapest";
  sellerIdsUsed: Seller["id"][];
  cost: PurchaseCost;
};

export type SellerBuildPricing = BuildPricing & {
  strategy: "single-seller";
  sellerId: Seller["id"];
  sellerName: Seller["name"] | null;
  differenceFromMixed: Money | null;
  effectiveDifferenceFromMixed: Money | null;
  cost: PurchaseCost;
};

export type BuildPurchaseComparison = {
  currency: Currency;
  mixedCheapest: MixedCheapestBuildPricing;
  singleSellerOptions: SellerBuildPricing[];
  cheapestCompleteSingleSellerByComponents: SellerBuildPricing | null;
  cheapestCompleteSingleSellerByEffectiveCost: SellerBuildPricing | null;
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
  shippingQuotes: readonly SellerShippingQuote[] = [],
  mixedCheapestEffectiveTotal: Money | null = null,
): SellerBuildPricing {
  const sellerOffers = offers.filter((offer) => offer.sellerId === seller.id);
  const pricing = evaluateBuildPricing(build, sellerOffers, currency);
  const cost = calculatePurchaseCost(
    pricing,
    getUniqueSellerIds(pricing.items),
    shippingQuotes,
    currency,
  );

  return {
    ...pricing,
    strategy: "single-seller",
    sellerId: seller.id,
    sellerName: seller.name,
    differenceFromMixed: getDifferenceFromMixed(pricing.total, mixedCheapestTotal),
    effectiveDifferenceFromMixed: getDifferenceFromMixed(
      cost.effectiveTotal,
      mixedCheapestEffectiveTotal,
    ),
    cost,
  };
}

export function evaluateBuildPurchaseComparison(
  build: PcBuild,
  offers: readonly ComponentOffer[],
  sellers: readonly Seller[],
  currency: Currency,
  shippingQuotes: readonly SellerShippingQuote[] = [],
): BuildPurchaseComparison {
  const mixedCheapestPricing = evaluateBuildPricing(build, offers, currency);
  const mixedCheapestSellerIds = getUniqueSellerIds(mixedCheapestPricing.items);
  const mixedCheapest: MixedCheapestBuildPricing = {
    ...mixedCheapestPricing,
    strategy: "mixed-cheapest" as const,
    sellerIdsUsed: mixedCheapestSellerIds,
    cost: calculatePurchaseCost(
      mixedCheapestPricing,
      mixedCheapestSellerIds,
      shippingQuotes,
      currency,
    ),
  };
  const selectedComponentIds = getSelectedComponentIds(build);

  if (selectedComponentIds.length === 0) {
    return {
      currency,
      mixedCheapest,
      singleSellerOptions: [],
      cheapestCompleteSingleSellerByComponents: null,
      cheapestCompleteSingleSellerByEffectiveCost: null,
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
      shippingQuotes,
      mixedCheapest.cost.effectiveTotal,
    ),
  );
  const cheapestCompleteSingleSellerByEffectiveCost =
    getCheapestCompleteSingleSellerByEffectiveCost(singleSellerOptions);

  return {
    currency,
    mixedCheapest,
    singleSellerOptions,
    cheapestCompleteSingleSellerByComponents:
      getCheapestCompleteSingleSellerByComponents(singleSellerOptions),
    cheapestCompleteSingleSellerByEffectiveCost,
    cheapestCompleteSingleSeller: cheapestCompleteSingleSellerByEffectiveCost,
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

function getUniqueSellerIds(items: readonly BuildPricingItem[]) {
  return [...new Set(items.map((item) => item.sellerId))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function calculatePurchaseCost(
  pricing: BuildPricing,
  sellerIdsUsed: readonly Seller["id"][],
  shippingQuotes: readonly SellerShippingQuote[],
  currency: Currency,
): PurchaseCost {
  const shippingPrices: Money[] = [];

  for (const sellerId of sellerIdsUsed) {
    const quote = findShippingQuote(sellerId, shippingQuotes, currency);

    if (!quote) {
      return {
        componentSubtotal: pricing.pricedSubtotal,
        shippingTotal: null,
        effectiveTotal: null,
        shippingStatus: "unknown",
      };
    }

    shippingPrices.push(quote.price);
  }

  const shippingTotalResult = addMoneyForCurrency(shippingPrices, currency);

  if (!shippingTotalResult.ok) {
    throw new Error("Purchase cost selected shipping quotes with mixed currencies.");
  }

  const effectiveTotal =
    pricing.total && pricing.status === "complete"
      ? addKnownMoney(pricing.total, shippingTotalResult.total)
      : null;

  return {
    componentSubtotal: pricing.pricedSubtotal,
    shippingTotal: shippingTotalResult.total,
    effectiveTotal,
    shippingStatus: "known",
  };
}

function findShippingQuote(
  sellerId: Seller["id"],
  shippingQuotes: readonly SellerShippingQuote[],
  currency: Currency,
) {
  return (
    shippingQuotes.find(
      (quote) => quote.sellerId === sellerId && quote.price.currency === currency,
    ) ?? null
  );
}

function addKnownMoney(left: Money, right: Money): Money {
  const result = addMoneyForCurrency([left, right], left.currency);

  if (!result.ok) {
    throw new Error("Cannot add Money values with different currencies.");
  }

  return result.total;
}

function getCheapestCompleteSingleSellerByComponents(
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

function getCheapestCompleteSingleSellerByEffectiveCost(
  sellerPricings: readonly SellerBuildPricing[],
): SellerBuildPricing | null {
  const completePricings = sellerPricings.filter(
    (pricing) =>
      pricing.status === "complete" &&
      pricing.total &&
      pricing.cost.shippingStatus === "known" &&
      pricing.cost.effectiveTotal,
  );

  if (completePricings.length === 0) {
    return null;
  }

  const [cheapestComplete] = [...completePricings].sort((left, right) => {
    const effectiveDifference =
      (left.cost.effectiveTotal?.amountMinor ?? 0) -
      (right.cost.effectiveTotal?.amountMinor ?? 0);

    if (effectiveDifference !== 0) {
      return effectiveDifference;
    }

    const componentSubtotalDifference =
      left.cost.componentSubtotal.amountMinor -
      right.cost.componentSubtotal.amountMinor;

    if (componentSubtotalDifference !== 0) {
      return componentSubtotalDifference;
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

import type { ComponentId } from "@/modules/catalog/types";
import type { PcBuild } from "@/modules/builds/types";

import { addMoneyForCurrency, type Currency, type Money } from "./money";
import type { ComponentOffer } from "./offers";

export type BuildPricingStatus = "unpriced" | "partial" | "complete";

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

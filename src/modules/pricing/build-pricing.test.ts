import { describe, expect, it } from "vitest";

import {
  clearGpu,
  createEmptyBuild,
  selectCase,
  selectCpu,
  selectCpuCooler,
  selectGpu,
  selectMemoryKit,
  selectMotherboard,
  selectPsu,
} from "../builds/build";

import {
  evaluateBuildPurchaseComparison,
  evaluateBuildPricing,
  evaluateSellerBuildPricing,
  selectOfferForComponent,
} from "./build-pricing";
import type { ComponentOffer, Seller, SellerShippingQuote } from "./offers";

const sellers = [
  { id: "seller-a", name: "Alpha Store" },
  { id: "seller-b", name: "Beta Store" },
  { id: "seller-c", name: "Gamma Store" },
  { id: "seller-d", name: "Tie Store" },
  { id: "seller-z", name: "No Relevant Offers" },
] as const satisfies readonly Seller[];

const offers = [
  {
    id: "offer-cpu-expensive",
    componentId: "cpu-a",
    sellerId: "seller-a",
    price: { amountMinor: 120000, currency: "ARS" },
  },
  {
    id: "offer-cpu-cheap",
    componentId: "cpu-a",
    sellerId: "seller-b",
    price: { amountMinor: 100000, currency: "ARS" },
  },
  {
    id: "offer-cpu-usd",
    componentId: "cpu-a",
    sellerId: "seller-c",
    price: { amountMinor: 9999, currency: "USD" },
  },
  {
    id: "offer-board",
    componentId: "motherboard-a",
    sellerId: "seller-a",
    price: { amountMinor: 200000, currency: "ARS" },
  },
  {
    id: "offer-gpu-tie-a",
    componentId: "gpu-a",
    sellerId: "seller-b",
    price: { amountMinor: 500000, currency: "ARS" },
  },
  {
    id: "offer-gpu-tie-b",
    componentId: "gpu-a",
    sellerId: "seller-a",
    price: { amountMinor: 500000, currency: "ARS" },
  },
  {
    id: "offer-memory",
    componentId: "memory-a",
    sellerId: "seller-a",
    price: { amountMinor: 75000, currency: "ARS" },
  },
  {
    id: "offer-psu",
    componentId: "psu-a",
    sellerId: "seller-b",
    price: { amountMinor: 90000, currency: "ARS" },
  },
  {
    id: "offer-psu-a",
    componentId: "psu-a",
    sellerId: "seller-a",
    price: { amountMinor: 95000, currency: "ARS" },
  },
  {
    id: "offer-case",
    componentId: "case-a",
    sellerId: "seller-a",
    price: { amountMinor: 65000, currency: "ARS" },
  },
  {
    id: "offer-cooler",
    componentId: "cooler-a",
    sellerId: "seller-b",
    price: { amountMinor: 30000, currency: "ARS" },
  },
  {
    id: "offer-cooler-a",
    componentId: "cooler-a",
    sellerId: "seller-a",
    price: { amountMinor: 35000, currency: "ARS" },
  },
  {
    id: "offer-cpu-c",
    componentId: "cpu-a",
    sellerId: "seller-c",
    price: { amountMinor: 110000, currency: "ARS" },
  },
  {
    id: "offer-board-c",
    componentId: "motherboard-a",
    sellerId: "seller-c",
    price: { amountMinor: 210000, currency: "ARS" },
  },
  {
    id: "offer-gpu-c",
    componentId: "gpu-a",
    sellerId: "seller-c",
    price: { amountMinor: 520000, currency: "ARS" },
  },
  {
    id: "offer-memory-c",
    componentId: "memory-a",
    sellerId: "seller-c",
    price: { amountMinor: 80000, currency: "ARS" },
  },
  {
    id: "offer-psu-c",
    componentId: "psu-a",
    sellerId: "seller-c",
    price: { amountMinor: 100000, currency: "ARS" },
  },
  {
    id: "offer-case-c",
    componentId: "case-a",
    sellerId: "seller-c",
    price: { amountMinor: 70000, currency: "ARS" },
  },
  {
    id: "offer-cooler-c",
    componentId: "cooler-a",
    sellerId: "seller-c",
    price: { amountMinor: 40000, currency: "ARS" },
  },
  {
    id: "offer-cpu-d",
    componentId: "cpu-a",
    sellerId: "seller-d",
    price: { amountMinor: 115000, currency: "ARS" },
  },
  {
    id: "offer-board-d",
    componentId: "motherboard-a",
    sellerId: "seller-d",
    price: { amountMinor: 200000, currency: "ARS" },
  },
  {
    id: "offer-gpu-d",
    componentId: "gpu-a",
    sellerId: "seller-d",
    price: { amountMinor: 505000, currency: "ARS" },
  },
  {
    id: "offer-memory-d",
    componentId: "memory-a",
    sellerId: "seller-d",
    price: { amountMinor: 75000, currency: "ARS" },
  },
  {
    id: "offer-psu-d",
    componentId: "psu-a",
    sellerId: "seller-d",
    price: { amountMinor: 95000, currency: "ARS" },
  },
  {
    id: "offer-case-d",
    componentId: "case-a",
    sellerId: "seller-d",
    price: { amountMinor: 65000, currency: "ARS" },
  },
  {
    id: "offer-cooler-d",
    componentId: "cooler-a",
    sellerId: "seller-d",
    price: { amountMinor: 35000, currency: "ARS" },
  },
  {
    id: "offer-usd-only",
    componentId: "gpu-usd-only",
    sellerId: "seller-c",
    price: { amountMinor: 29999, currency: "USD" },
  },
] as const satisfies readonly ComponentOffer[];

const shippingQuotes = [
  {
    sellerId: "seller-a",
    price: { amountMinor: 10000, currency: "ARS" },
  },
  {
    sellerId: "seller-b",
    price: { amountMinor: 80000, currency: "ARS" },
  },
  {
    sellerId: "seller-c",
    price: { amountMinor: 0, currency: "ARS" },
  },
  {
    sellerId: "seller-d",
    price: { amountMinor: 10000, currency: "ARS" },
  },
  {
    sellerId: "seller-a",
    price: { amountMinor: 999, currency: "USD" },
  },
] as const satisfies readonly SellerShippingQuote[];

function createCompleteBuild() {
  return selectCpuCooler(
    selectCase(
      selectPsu(
        selectMemoryKit(
          selectGpu(
            selectMotherboard(selectCpu(createEmptyBuild(), "cpu-a"), "motherboard-a"),
            "gpu-a",
          ),
          "memory-a",
        ),
        "psu-a",
      ),
      "case-a",
    ),
    "cooler-a",
  );
}

describe("selectOfferForComponent", () => {
  it("returns a single matching offer", () => {
    expect(
      selectOfferForComponent("motherboard-a", offers, "ARS")?.id,
    ).toBe("offer-board");
  });

  it("chooses the cheapest offer in the requested currency", () => {
    expect(selectOfferForComponent("cpu-a", offers, "ARS")?.id).toBe(
      "offer-cpu-cheap",
    );
  });

  it("ignores offers in another currency", () => {
    expect(selectOfferForComponent("cpu-a", offers, "USD")?.id).toBe(
      "offer-cpu-usd",
    );
  });

  it("uses offer id as deterministic tie-break", () => {
    expect(selectOfferForComponent("gpu-a", offers, "ARS")?.id).toBe(
      "offer-gpu-tie-a",
    );
  });

  it("returns null when no offer exists in the requested currency", () => {
    expect(selectOfferForComponent("gpu-usd-only", offers, "ARS")).toBeNull();
  });
});

describe("evaluateBuildPricing", () => {
  it("returns complete zero pricing for an empty build", () => {
    expect(evaluateBuildPricing(createEmptyBuild(), offers, "ARS")).toEqual({
      currency: "ARS",
      items: [],
      pricedSubtotal: { amountMinor: 0, currency: "ARS" },
      total: { amountMinor: 0, currency: "ARS" },
      pricedComponentCount: 0,
      missingPriceComponentIds: [],
      status: "complete",
    });
  });

  it("prices a partial build when all selected components have prices", () => {
    const build = selectMotherboard(selectCpu(createEmptyBuild(), "cpu-a"), "motherboard-a");

    expect(evaluateBuildPricing(build, offers, "ARS")).toMatchObject({
      pricedSubtotal: { amountMinor: 300000, currency: "ARS" },
      total: { amountMinor: 300000, currency: "ARS" },
      pricedComponentCount: 2,
      missingPriceComponentIds: [],
      status: "complete",
    });
  });

  it("returns partial pricing when some selected components lack prices", () => {
    const build = selectGpu(selectCpu(createEmptyBuild(), "cpu-a"), "gpu-usd-only");

    expect(evaluateBuildPricing(build, offers, "ARS")).toMatchObject({
      pricedSubtotal: { amountMinor: 100000, currency: "ARS" },
      total: null,
      pricedComponentCount: 1,
      missingPriceComponentIds: ["gpu-usd-only"],
      status: "partial",
    });
  });

  it("prices a complete build with all selected components", () => {
    expect(evaluateBuildPricing(createCompleteBuild(), offers, "ARS")).toMatchObject({
      pricedSubtotal: { amountMinor: 1060000, currency: "ARS" },
      total: { amountMinor: 1060000, currency: "ARS" },
      pricedComponentCount: 7,
      missingPriceComponentIds: [],
      status: "complete",
    });
  });

  it("returns items in build slot order", () => {
    expect(
      evaluateBuildPricing(createCompleteBuild(), offers, "ARS").items.map(
        (item) => item.slot,
      ),
    ).toEqual([
      "cpu",
      "motherboard",
      "gpu",
      "memoryKit",
      "psu",
      "case",
      "cpuCooler",
    ]);
  });

  it("returns unpriced when selected components have no offer in the currency", () => {
    const build = selectGpu(createEmptyBuild(), "gpu-usd-only");

    expect(evaluateBuildPricing(build, offers, "ARS")).toMatchObject({
      pricedSubtotal: { amountMinor: 0, currency: "ARS" },
      total: null,
      pricedComponentCount: 0,
      missingPriceComponentIds: ["gpu-usd-only"],
      status: "unpriced",
    });
  });

  it("changes pricing when a selection changes", () => {
    const baseBuild = selectCpu(createEmptyBuild(), "cpu-a");
    const withGpu = selectGpu(baseBuild, "gpu-a");

    expect(evaluateBuildPricing(baseBuild, offers, "ARS").pricedSubtotal).toEqual({
      amountMinor: 100000,
      currency: "ARS",
    });
    expect(evaluateBuildPricing(withGpu, offers, "ARS").pricedSubtotal).toEqual({
      amountMinor: 600000,
      currency: "ARS",
    });
  });

  it("updates pricing when a component is cleared", () => {
    const build = clearGpu(createCompleteBuild());

    expect(evaluateBuildPricing(build, offers, "ARS")).toMatchObject({
      pricedSubtotal: { amountMinor: 560000, currency: "ARS" },
      total: { amountMinor: 560000, currency: "ARS" },
      pricedComponentCount: 6,
      status: "complete",
    });
  });

  it("does not mutate the build", () => {
    const build = createCompleteBuild();
    const before = { ...build };

    evaluateBuildPricing(build, offers, "ARS");

    expect(build).toEqual(before);
  });

  it("does not mutate offers", () => {
    const before = offers.map((offer) => ({ ...offer, price: { ...offer.price } }));

    evaluateBuildPricing(createCompleteBuild(), offers, "ARS");

    expect(offers).toEqual(before);
  });
});

describe("evaluateSellerBuildPricing", () => {
  it("returns complete for a seller with all selected component offers", () => {
    expect(
      evaluateSellerBuildPricing(
        createCompleteBuild(),
        offers,
        sellers[0],
        "ARS",
        null,
        shippingQuotes,
      ),
    ).toMatchObject({
      sellerId: "seller-a",
      status: "complete",
      pricedSubtotal: { amountMinor: 1090000, currency: "ARS" },
      total: { amountMinor: 1090000, currency: "ARS" },
      missingPriceComponentIds: [],
      cost: {
        componentSubtotal: { amountMinor: 1090000, currency: "ARS" },
        shippingTotal: { amountMinor: 10000, currency: "ARS" },
        effectiveTotal: { amountMinor: 1100000, currency: "ARS" },
        shippingStatus: "known",
      },
    });
  });

  it("returns partial for a seller with only some selected component offers", () => {
    expect(
      evaluateSellerBuildPricing(
        createCompleteBuild(),
        offers,
        sellers[1],
        "ARS",
        null,
        shippingQuotes,
      ),
    ).toMatchObject({
      sellerId: "seller-b",
      status: "partial",
      pricedSubtotal: { amountMinor: 720000, currency: "ARS" },
      total: null,
      missingPriceComponentIds: ["motherboard-a", "memory-a", "case-a"],
      cost: {
        shippingTotal: { amountMinor: 80000, currency: "ARS" },
        effectiveTotal: null,
        shippingStatus: "known",
      },
    });
  });

  it("returns unpriced for a seller without relevant offers", () => {
    expect(
      evaluateSellerBuildPricing(
        selectCpu(createEmptyBuild(), "cpu-a"),
        offers,
        sellers[4],
        "ARS",
        null,
        shippingQuotes,
      ),
    ).toMatchObject({
      sellerId: "seller-z",
      status: "unpriced",
      pricedSubtotal: { amountMinor: 0, currency: "ARS" },
      total: null,
      missingPriceComponentIds: ["cpu-a"],
      cost: {
        shippingTotal: { amountMinor: 0, currency: "ARS" },
        effectiveTotal: null,
        shippingStatus: "known",
      },
    });
  });

  it("ignores offers in the wrong currency", () => {
    expect(
      evaluateSellerBuildPricing(
        selectGpu(createEmptyBuild(), "gpu-usd-only"),
        offers,
        sellers[2],
        "ARS",
        null,
        shippingQuotes,
      ),
    ).toMatchObject({
      status: "unpriced",
      missingPriceComponentIds: ["gpu-usd-only"],
    });
  });

  it("applies fixed shipping once for two components from the same seller", () => {
    const build = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-a"),
      "motherboard-a",
    );

    expect(
      evaluateSellerBuildPricing(
        build,
        offers,
        sellers[0],
        "ARS",
        null,
        shippingQuotes,
      ),
    ).toMatchObject({
      cost: {
        componentSubtotal: { amountMinor: 320000, currency: "ARS" },
        shippingTotal: { amountMinor: 10000, currency: "ARS" },
        effectiveTotal: { amountMinor: 330000, currency: "ARS" },
      },
    });
  });

  it("treats explicit zero shipping as known", () => {
    expect(
      evaluateSellerBuildPricing(
        selectCpu(createEmptyBuild(), "cpu-a"),
        offers,
        sellers[2],
        "ARS",
        null,
        shippingQuotes,
      ),
    ).toMatchObject({
      sellerId: "seller-c",
      cost: {
        shippingTotal: { amountMinor: 0, currency: "ARS" },
        effectiveTotal: { amountMinor: 110000, currency: "ARS" },
        shippingStatus: "known",
      },
    });
  });

  it("marks shipping as unknown when a used seller has no quote", () => {
    expect(
      evaluateSellerBuildPricing(
        selectCpu(createEmptyBuild(), "cpu-a"),
        offers,
        sellers[1],
        "ARS",
        null,
        [],
      ),
    ).toMatchObject({
      sellerId: "seller-b",
      status: "complete",
      cost: {
        shippingTotal: null,
        effectiveTotal: null,
        shippingStatus: "unknown",
      },
    });
  });

  it("ignores shipping quotes in another currency", () => {
    expect(
      evaluateSellerBuildPricing(
        selectCpu(createEmptyBuild(), "cpu-a"),
        offers,
        sellers[0],
        "ARS",
        null,
        [
          {
            sellerId: "seller-a",
            price: { amountMinor: 999, currency: "USD" },
          },
        ],
      ),
    ).toMatchObject({
      cost: {
        shippingTotal: null,
        effectiveTotal: null,
        shippingStatus: "unknown",
      },
    });
  });
});

describe("evaluateBuildPurchaseComparison", () => {
  it("uses the existing mixed cheapest semantics", () => {
    const comparison = evaluateBuildPurchaseComparison(
      createCompleteBuild(),
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.mixedCheapest).toMatchObject({
      strategy: "mixed-cheapest",
      total: { amountMinor: 1060000, currency: "ARS" },
      pricedComponentCount: 7,
      status: "complete",
      cost: {
        componentSubtotal: { amountMinor: 1060000, currency: "ARS" },
      },
    });
  });

  it("allows mixed cheapest to use multiple sellers", () => {
    const comparison = evaluateBuildPurchaseComparison(
      createCompleteBuild(),
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(new Set(comparison.mixedCheapest.items.map((item) => item.sellerId))).toEqual(
      new Set(["seller-a", "seller-b"]),
    );
    expect(comparison.mixedCheapest.sellerIdsUsed).toEqual([
      "seller-a",
      "seller-b",
    ]);
  });

  it("adds shipping once for each seller used by mixed cheapest", () => {
    const comparison = evaluateBuildPurchaseComparison(
      createCompleteBuild(),
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.mixedCheapest.cost).toEqual({
      componentSubtotal: { amountMinor: 1060000, currency: "ARS" },
      shippingTotal: { amountMinor: 90000, currency: "ARS" },
      effectiveTotal: { amountMinor: 1150000, currency: "ARS" },
      shippingStatus: "known",
    });
  });

  it("charges mixed shipping once when one seller is used more than once", () => {
    const build = selectCase(
      selectMotherboard(createEmptyBuild(), "motherboard-a"),
      "case-a",
    );
    const comparison = evaluateBuildPurchaseComparison(
      build,
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.mixedCheapest.sellerIdsUsed).toEqual(["seller-a"]);
    expect(comparison.mixedCheapest.cost).toMatchObject({
      componentSubtotal: { amountMinor: 265000, currency: "ARS" },
      shippingTotal: { amountMinor: 10000, currency: "ARS" },
      effectiveTotal: { amountMinor: 275000, currency: "ARS" },
    });
  });

  it("returns unknown mixed shipping when a used seller has no quote", () => {
    const comparison = evaluateBuildPurchaseComparison(
      selectCpu(createEmptyBuild(), "cpu-a"),
      offers,
      sellers,
      "ARS",
      [],
    );

    expect(comparison.mixedCheapest.cost).toEqual({
      componentSubtotal: { amountMinor: 100000, currency: "ARS" },
      shippingTotal: null,
      effectiveTotal: null,
      shippingStatus: "unknown",
    });
  });

  it("keeps every single-seller option scoped to one seller", () => {
    const comparison = evaluateBuildPurchaseComparison(
      createCompleteBuild(),
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(
      comparison.singleSellerOptions.every((option) =>
        option.items.every((item) => item.sellerId === option.sellerId),
      ),
    ).toBe(true);
  });

  it("chooses the cheapest complete single seller", () => {
    const comparison = evaluateBuildPurchaseComparison(
      createCompleteBuild(),
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.cheapestCompleteSingleSeller).toMatchObject({
      sellerId: "seller-a",
      total: { amountMinor: 1090000, currency: "ARS" },
      differenceFromMixed: { amountMinor: 30000, currency: "ARS" },
      cost: {
        shippingTotal: { amountMinor: 10000, currency: "ARS" },
        effectiveTotal: { amountMinor: 1100000, currency: "ARS" },
      },
      effectiveDifferenceFromMixed: { amountMinor: -50000, currency: "ARS" },
    });
  });

  it("does not allow a partial seller to win", () => {
    const comparison = evaluateBuildPurchaseComparison(
      createCompleteBuild(),
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.singleSellerOptions.find((option) => option.sellerId === "seller-b")).toMatchObject({
      status: "partial",
    });
    expect(comparison.cheapestCompleteSingleSeller?.sellerId).not.toBe("seller-b");
  });

  it("uses seller id as deterministic tie-break for equal complete totals", () => {
    const comparison = evaluateBuildPurchaseComparison(
      createCompleteBuild(),
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.singleSellerOptions.find((option) => option.sellerId === "seller-d")).toMatchObject({
      total: { amountMinor: 1090000, currency: "ARS" },
    });
    expect(comparison.cheapestCompleteSingleSeller?.sellerId).toBe("seller-a");
  });

  it("keeps component-subtotal winner separate from effective-cost winner", () => {
    const comparison = evaluateBuildPurchaseComparison(
      createCompleteBuild(),
      offers,
      sellers,
      "ARS",
      [
        {
          sellerId: "seller-a",
          price: { amountMinor: 100000, currency: "ARS" },
        },
        {
          sellerId: "seller-c",
          price: { amountMinor: 0, currency: "ARS" },
        },
        {
          sellerId: "seller-d",
          price: { amountMinor: 100000, currency: "ARS" },
        },
      ],
    );

    expect(comparison.cheapestCompleteSingleSellerByComponents).toMatchObject({
      sellerId: "seller-a",
      total: { amountMinor: 1090000, currency: "ARS" },
    });
    expect(comparison.cheapestCompleteSingleSellerByEffectiveCost).toMatchObject({
      sellerId: "seller-c",
      cost: {
        effectiveTotal: { amountMinor: 1130000, currency: "ARS" },
      },
    });
  });

  it("returns zero difference when single seller matches mixed cheapest", () => {
    const build = selectCpu(createEmptyBuild(), "cpu-a");
    const comparison = evaluateBuildPurchaseComparison(
      build,
      offers,
      sellers,
      "ARS",
      [
        {
          sellerId: "seller-b",
          price: { amountMinor: 0, currency: "ARS" },
        },
      ],
    );

    expect(comparison.cheapestCompleteSingleSeller).toMatchObject({
      sellerId: "seller-b",
      cost: {
        effectiveTotal: { amountMinor: 100000, currency: "ARS" },
      },
      effectiveDifferenceFromMixed: { amountMinor: 0, currency: "ARS" },
    });
  });

  it("returns positive effective difference when single seller costs more", () => {
    const build = selectCpu(createEmptyBuild(), "cpu-a");
    const comparison = evaluateBuildPurchaseComparison(
      build,
      offers,
      sellers,
      "ARS",
      [
        {
          sellerId: "seller-b",
          price: { amountMinor: 10000, currency: "ARS" },
        },
        {
          sellerId: "seller-c",
          price: { amountMinor: 50000, currency: "ARS" },
        },
      ],
    );

    expect(comparison.cheapestCompleteSingleSeller).toMatchObject({
      sellerId: "seller-b",
      effectiveDifferenceFromMixed: { amountMinor: 0, currency: "ARS" },
    });
    expect(
      comparison.singleSellerOptions.find((option) => option.sellerId === "seller-c"),
    ).toMatchObject({
      effectiveDifferenceFromMixed: { amountMinor: 50000, currency: "ARS" },
    });
  });

  it("returns negative effective difference when single seller beats mixed shipping", () => {
    const build = selectGpu(selectCpu(createEmptyBuild(), "cpu-a"), "gpu-a");
    const comparison = evaluateBuildPurchaseComparison(
      build,
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.mixedCheapest.cost.effectiveTotal).toEqual({
      amountMinor: 680000,
      currency: "ARS",
    });
    expect(comparison.cheapestCompleteSingleSeller).toMatchObject({
      sellerId: "seller-a",
      effectiveDifferenceFromMixed: { amountMinor: -50000, currency: "ARS" },
    });
  });

  it("cannot compare effective totals when required shipping is unknown", () => {
    const comparison = evaluateBuildPurchaseComparison(
      selectCpu(createEmptyBuild(), "cpu-a"),
      offers,
      sellers,
      "ARS",
      [],
    );

    expect(comparison.mixedCheapest.cost.effectiveTotal).toBeNull();
    expect(comparison.cheapestCompleteSingleSeller).toBeNull();
    expect(
      comparison.singleSellerOptions.every(
        (option) => option.effectiveDifferenceFromMixed === null,
      ),
    ).toBe(true);
  });

  it("returns null when no seller covers the selected components", () => {
    const build = selectGpu(createEmptyBuild(), "gpu-usd-only");
    const comparison = evaluateBuildPurchaseComparison(
      build,
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.cheapestCompleteSingleSeller).toBeNull();
  });

  it("returns no single-seller options for an empty build", () => {
    expect(
      evaluateBuildPurchaseComparison(
        createEmptyBuild(),
        offers,
        sellers,
        "ARS",
        shippingQuotes,
      ),
    ).toMatchObject({
      singleSellerOptions: [],
      cheapestCompleteSingleSeller: null,
      mixedCheapest: {
        status: "complete",
        total: { amountMinor: 0, currency: "ARS" },
        cost: {
          componentSubtotal: { amountMinor: 0, currency: "ARS" },
          shippingTotal: { amountMinor: 0, currency: "ARS" },
          effectiveTotal: { amountMinor: 0, currency: "ARS" },
          shippingStatus: "known",
        },
      },
    });
  });

  it("supports partial selected builds", () => {
    const build = selectGpu(selectCpu(createEmptyBuild(), "cpu-a"), "gpu-a");
    const comparison = evaluateBuildPurchaseComparison(
      build,
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.cheapestCompleteSingleSeller).toMatchObject({
      sellerId: "seller-a",
      total: { amountMinor: 620000, currency: "ARS" },
      cost: {
        effectiveTotal: { amountMinor: 630000, currency: "ARS" },
      },
      effectiveDifferenceFromMixed: { amountMinor: -50000, currency: "ARS" },
    });
  });

  it("changes comparison when a component changes", () => {
    const baseBuild = selectCpu(createEmptyBuild(), "cpu-a");
    const withGpu = selectGpu(baseBuild, "gpu-a");

    expect(
      evaluateBuildPurchaseComparison(baseBuild, offers, sellers, "ARS")
        .mixedCheapest.total,
    ).toEqual({ amountMinor: 100000, currency: "ARS" });
    expect(
      evaluateBuildPurchaseComparison(withGpu, offers, sellers, "ARS")
        .mixedCheapest.total,
    ).toEqual({ amountMinor: 600000, currency: "ARS" });
  });

  it("changes comparison when a component is cleared", () => {
    const comparison = evaluateBuildPurchaseComparison(
      clearGpu(createCompleteBuild()),
      offers,
      sellers,
      "ARS",
      shippingQuotes,
    );

    expect(comparison.mixedCheapest.total).toEqual({
      amountMinor: 560000,
      currency: "ARS",
    });
  });

  it("does not mutate build, offers, sellers, or shipping", () => {
    const build = createCompleteBuild();
    const buildBefore = { ...build };
    const offersBefore = offers.map((offer) => ({
      ...offer,
      price: { ...offer.price },
    }));
    const sellersBefore = sellers.map((seller) => ({ ...seller }));
    const shippingBefore = shippingQuotes.map((quote) => ({
      ...quote,
      price: { ...quote.price },
    }));

    evaluateBuildPurchaseComparison(build, offers, sellers, "ARS", shippingQuotes);

    expect(build).toEqual(buildBefore);
    expect(offers).toEqual(offersBefore);
    expect(sellers).toEqual(sellersBefore);
    expect(shippingQuotes).toEqual(shippingBefore);
  });
});

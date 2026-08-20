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
  evaluateBuildPricing,
  selectOfferForComponent,
} from "./build-pricing";
import type { ComponentOffer } from "./offers";

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
    id: "offer-usd-only",
    componentId: "gpu-usd-only",
    sellerId: "seller-c",
    price: { amountMinor: 29999, currency: "USD" },
  },
] as const satisfies readonly ComponentOffer[];

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

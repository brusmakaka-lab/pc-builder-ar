import { describe, expect, it } from "vitest";

import { selectCpu, createEmptyBuild } from "../builds/build";
import { evaluateBuildPurchaseComparison } from "../pricing/build-pricing";
import {
  getAllSellers,
  getAllSellerShippingQuotes,
} from "../pricing/offers";

import {
  demoComponentReferenceMap,
  demoOfferSource,
  demoOfferSourceId,
  demoSellerReferenceMap,
} from "./demo-offer-source";
import {
  normalizeExternalOffer,
  normalizeExternalOffers,
} from "./normalization";
import type {
  ComponentReferenceMap,
  ExternalOffer,
  SellerReferenceMap,
} from "./types";

const validExternalOffer = {
  externalId: "external-cpu-7600",
  sourceId: demoOfferSourceId,
  sellerExternalId: "demo-hardware-external",
  componentReference: "amd-ryzen-5-7600",
  price: { amountMinor: 27500000, currency: "ARS" },
  observedAt: "2026-08-20T06:00:00.000Z",
} satisfies ExternalOffer;

describe("demoOfferSource", () => {
  it("returns deterministic external offers", async () => {
    const firstLoad = await demoOfferSource.load();
    const secondLoad = await demoOfferSource.load();

    expect(firstLoad).toEqual(secondLoad);
    expect(firstLoad.map((offer) => offer.externalId)).toEqual([
      "demo-offer-7600",
      "demo-offer-unknown-component",
      "demo-offer-unknown-seller",
      "demo-offer-invalid-price",
      "demo-offer-7600",
      "demo-offer-4060-usd",
    ]);
  });

  it("does not expose mutable fixture objects", async () => {
    const firstLoad = await demoOfferSource.load();

    firstLoad[0].price.amountMinor = 1;

    const secondLoad = await demoOfferSource.load();
    expect(secondLoad[0].price.amountMinor).toBe(27500000);
  });
});

describe("normalizeExternalOffer", () => {
  it("accepts a valid offer with mapped component and seller", () => {
    expect(
      normalizeExternalOffer(
        validExternalOffer,
        demoComponentReferenceMap,
        demoSellerReferenceMap,
      ),
    ).toEqual({
      status: "accepted",
      offer: {
        id: "external:demo-offer-source:external-cpu-7600",
        componentId: "cpu-amd-ryzen-5-7600",
        sellerId: "seller-demo-a",
        price: { amountMinor: 27500000, currency: "ARS" },
      },
      provenance: {
        sourceId: demoOfferSourceId,
        externalOfferId: "external-cpu-7600",
        observedAt: "2026-08-20T06:00:00.000Z",
      },
    });
  });

  it("rejects an unknown component reference", () => {
    expect(
      normalizeExternalOffer(
        { ...validExternalOffer, componentReference: "missing-component" },
        demoComponentReferenceMap,
        demoSellerReferenceMap,
      ),
    ).toMatchObject({
      status: "rejected",
      reason: { code: "unknown-component" },
    });
  });

  it("rejects an unknown seller reference", () => {
    expect(
      normalizeExternalOffer(
        { ...validExternalOffer, sellerExternalId: "missing-seller" },
        demoComponentReferenceMap,
        demoSellerReferenceMap,
      ),
    ).toMatchObject({
      status: "rejected",
      reason: { code: "unknown-seller" },
    });
  });

  it("rejects negative prices", () => {
    expect(
      normalizeExternalOffer(
        {
          ...validExternalOffer,
          price: { amountMinor: -1, currency: "ARS" },
        },
        demoComponentReferenceMap,
        demoSellerReferenceMap,
      ),
    ).toMatchObject({
      status: "rejected",
      reason: { code: "invalid-price" },
    });
  });

  it("rejects unsupported currencies", () => {
    expect(
      normalizeExternalOffer(
        {
          ...validExternalOffer,
          price: { amountMinor: 27500000, currency: "EUR" },
        },
        demoComponentReferenceMap,
        demoSellerReferenceMap,
      ),
    ).toMatchObject({
      status: "rejected",
      reason: { code: "unsupported-currency" },
    });
  });

  it("rejects invalid observedAt values", () => {
    expect(
      normalizeExternalOffer(
        { ...validExternalOffer, observedAt: "2026-08-20 06:00:00" },
        demoComponentReferenceMap,
        demoSellerReferenceMap,
      ),
    ).toMatchObject({
      status: "rejected",
      reason: { code: "invalid-observed-at" },
    });
  });

  it("rejects empty external ids", () => {
    expect(
      normalizeExternalOffer(
        { ...validExternalOffer, externalId: " " },
        demoComponentReferenceMap,
        demoSellerReferenceMap,
      ),
    ).toMatchObject({
      status: "rejected",
      reason: { code: "invalid-external-id" },
    });
  });

  it("does not mutate input or mappings", () => {
    const externalOfferBefore = {
      ...validExternalOffer,
      price: { ...validExternalOffer.price },
    };
    const componentMappingBefore = { ...demoComponentReferenceMap };
    const sellerMappingBefore = { ...demoSellerReferenceMap };

    normalizeExternalOffer(
      validExternalOffer,
      demoComponentReferenceMap,
      demoSellerReferenceMap,
    );

    expect(validExternalOffer).toEqual(externalOfferBefore);
    expect(demoComponentReferenceMap).toEqual(componentMappingBefore);
    expect(demoSellerReferenceMap).toEqual(sellerMappingBefore);
  });
});

describe("normalizeExternalOffers", () => {
  it("keeps accepting valid offers when another offer is rejected", () => {
    const result = normalizeExternalOffers(
      [
        validExternalOffer,
        { ...validExternalOffer, externalId: "bad", componentReference: "bad" },
        { ...validExternalOffer, externalId: "external-cpu-7600-b" },
      ],
      demoComponentReferenceMap,
      demoSellerReferenceMap,
    );

    expect(result.accepted).toHaveLength(2);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason.code).toBe("unknown-component");
  });

  it("rejects duplicate sourceId and externalId after the first accepted offer", () => {
    const result = normalizeExternalOffers(
      [
        validExternalOffer,
        {
          ...validExternalOffer,
          price: { amountMinor: 27000000, currency: "ARS" },
        },
      ],
      demoComponentReferenceMap,
      demoSellerReferenceMap,
    );

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason.code).toBe("duplicate-external-offer");
  });

  it("keeps deterministic accepted and rejected order", () => {
    const result = normalizeExternalOffers(
      [
        { ...validExternalOffer, externalId: "first" },
        { ...validExternalOffer, externalId: "second", componentReference: "bad" },
        { ...validExternalOffer, externalId: "third" },
      ],
      demoComponentReferenceMap,
      demoSellerReferenceMap,
    );

    expect(result.accepted.map((item) => item.provenance.externalOfferId)).toEqual([
      "first",
      "third",
    ]);
    expect(result.rejected.map((item) => item.externalOffer.externalId)).toEqual([
      "second",
    ]);
  });

  it("does not mutate batch input", () => {
    const batch = [
      validExternalOffer,
      { ...validExternalOffer, externalId: "second" },
    ];
    const batchBefore = batch.map((offer) => ({
      ...offer,
      price: { ...offer.price },
    }));

    normalizeExternalOffers(
      batch,
      demoComponentReferenceMap,
      demoSellerReferenceMap,
    );

    expect(batch).toEqual(batchBefore);
  });
});

describe("offer ingestion integration", () => {
  it("loads demo offers, normalizes accepted offers, and evaluates pricing", async () => {
    const externalOffers = await demoOfferSource.load();
    const ingestionResult = normalizeExternalOffers(
      externalOffers,
      demoComponentReferenceMap,
      demoSellerReferenceMap,
    );
    const comparison = evaluateBuildPurchaseComparison(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      ingestionResult.accepted.map((item) => item.offer),
      getAllSellers(),
      "ARS",
      getAllSellerShippingQuotes(),
    );

    expect(ingestionResult.accepted).toHaveLength(2);
    expect(ingestionResult.rejected.map((item) => item.reason.code)).toEqual([
      "unknown-component",
      "unknown-seller",
      "invalid-price",
      "duplicate-external-offer",
    ]);
    expect(comparison.mixedCheapest).toMatchObject({
      status: "complete",
      total: { amountMinor: 27500000, currency: "ARS" },
    });
    expect(comparison.optimized).toMatchObject({
      status: "complete",
    });
  });

  it("uses explicit component and seller mappings instead of identity assumptions", () => {
    const componentMapping = {
      externalCpuName: "cpu-amd-ryzen-5-7600",
    } satisfies ComponentReferenceMap;
    const sellerMapping = {
      externalSellerName: "seller-demo-a",
    } satisfies SellerReferenceMap;
    const result = normalizeExternalOffer(
      {
        ...validExternalOffer,
        sellerExternalId: "externalSellerName",
        componentReference: "externalCpuName",
      },
      componentMapping,
      sellerMapping,
    );

    expect(result).toMatchObject({
      status: "accepted",
      offer: {
        componentId: "cpu-amd-ryzen-5-7600",
        sellerId: "seller-demo-a",
      },
    });
  });
});

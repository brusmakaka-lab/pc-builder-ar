import { describe, expect, it } from "vitest";

import { addMoney } from "./money";

describe("addMoney", () => {
  it("adds integer minor units in the same currency", () => {
    expect(
      addMoney([
        { amountMinor: 105000000, currency: "ARS" },
        { amountMinor: 25000000, currency: "ARS" },
      ]),
    ).toEqual({
      ok: true,
      total: { amountMinor: 130000000, currency: "ARS" },
    });
  });

  it("rejects mixed currencies", () => {
    expect(
      addMoney([
        { amountMinor: 100, currency: "ARS" },
        { amountMinor: 100, currency: "USD" },
      ]),
    ).toEqual({ ok: false, reason: "currency_mismatch" });
  });
});

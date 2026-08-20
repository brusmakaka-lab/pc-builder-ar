import { describe, expect, it } from "vitest";

import { addMoney, addMoneyForCurrency, createZeroMoney } from "./money";

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

  it("uses integer minor units for cents", () => {
    expect(
      addMoney([
        { amountMinor: 9999, currency: "USD" },
        { amountMinor: 1, currency: "USD" },
      ]),
    ).toEqual({
      ok: true,
      total: { amountMinor: 10000, currency: "USD" },
    });
  });

  it("creates zero money for an explicit currency", () => {
    expect(createZeroMoney("USD")).toEqual({
      amountMinor: 0,
      currency: "USD",
    });
  });

  it("adds an empty list in the requested currency", () => {
    expect(addMoneyForCurrency([], "USD")).toEqual({
      ok: true,
      total: { amountMinor: 0, currency: "USD" },
    });
  });

  it("rejects values outside the requested currency", () => {
    expect(
      addMoneyForCurrency([{ amountMinor: 100, currency: "USD" }], "ARS"),
    ).toEqual({ ok: false, reason: "currency_mismatch" });
  });
});

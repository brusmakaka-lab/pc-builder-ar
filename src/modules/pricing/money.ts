import { z } from "zod";

export const currencySchema = z.enum(["ARS", "USD"]);

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: currencySchema,
});

export type Currency = z.infer<typeof currencySchema>;
export type Money = z.infer<typeof moneySchema>;

export type PricingResult =
  | { ok: true; total: Money }
  | { ok: false; reason: "currency_mismatch" };

export function addMoney(values: Money[]): PricingResult {
  if (values.length === 0) {
    return { ok: true, total: createZeroMoney("ARS") };
  }

  const [first, ...rest] = values;
  const hasCurrencyMismatch = rest.some(
    (value) => value.currency !== first.currency,
  );

  if (hasCurrencyMismatch) {
    return { ok: false, reason: "currency_mismatch" };
  }

  return {
    ok: true,
    total: {
      amountMinor: values.reduce((sum, value) => sum + value.amountMinor, 0),
      currency: first.currency,
    },
  };
}

export function createZeroMoney(currency: Currency): Money {
  return { amountMinor: 0, currency };
}

export function addMoneyForCurrency(
  values: readonly Money[],
  currency: Currency,
): PricingResult {
  if (values.length === 0) {
    return { ok: true, total: createZeroMoney(currency) };
  }

  if (values.some((value) => value.currency !== currency)) {
    return { ok: false, reason: "currency_mismatch" };
  }

  return addMoney([...values]);
}

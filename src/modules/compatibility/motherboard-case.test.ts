import { describe, expect, it } from "vitest";

import { checkMotherboardCaseCompatibility } from "./motherboard-case";

const motherboard = {
  id: "motherboard-test",
  kind: "motherboard",
  brand: "Test",
  model: "ATX Board",
  socket: "AM5",
  chipset: "B650",
  formFactor: "ATX",
  memoryType: "DDR5",
  memorySlots: 4,
} as const;

const pcCase = {
  id: "case-test",
  kind: "case",
  brand: "Test",
  model: "Case",
  maxGpuLengthMm: 360,
} as const;

describe("checkMotherboardCaseCompatibility", () => {
  it("accepts an explicitly supported motherboard form factor", () => {
    expect(
      checkMotherboardCaseCompatibility(motherboard, {
        ...pcCase,
        supportedMotherboardFormFactors: ["ATX", "MicroATX"],
      }),
    ).toEqual({ compatible: true });
  });

  it("rejects a motherboard form factor that is not listed by the case", () => {
    expect(
      checkMotherboardCaseCompatibility(motherboard, {
        ...pcCase,
        supportedMotherboardFormFactors: ["MicroATX"],
      }),
    ).toEqual({
      compatible: false,
      reason: {
        code: "FORM_FACTOR_NOT_SUPPORTED",
        motherboardFormFactor: "ATX",
        supportedMotherboardFormFactors: ["MicroATX"],
      },
    });
  });

  it("does not infer a form factor hierarchy", () => {
    expect(
      checkMotherboardCaseCompatibility(
        { ...motherboard, formFactor: "MicroATX" },
        {
          ...pcCase,
          supportedMotherboardFormFactors: ["ATX"],
        },
      ).compatible,
    ).toBe(false);
  });
});

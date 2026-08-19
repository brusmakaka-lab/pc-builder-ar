import { describe, expect, it } from "vitest";

import { checkMemoryMotherboardCompatibility } from "./memory-motherboard";

const ddr4Motherboard = {
  id: "motherboard-ddr4",
  kind: "motherboard",
  brand: "ASUS",
  model: "B550",
  socket: "AM4",
  chipset: "B550",
  formFactor: "MicroATX",
  memoryType: "DDR4",
  memorySlots: 4,
} as const;

const ddr5Motherboard = {
  id: "motherboard-ddr5",
  kind: "motherboard",
  brand: "MSI",
  model: "B650",
  socket: "AM5",
  chipset: "B650",
  formFactor: "ATX",
  memoryType: "DDR5",
  memorySlots: 4,
} as const;

const ddr4MemoryKit = {
  id: "memory-ddr4",
  kind: "memoryKit",
  brand: "Corsair",
  model: "Vengeance LPX",
  memoryType: "DDR4",
  capacityGb: 16,
  moduleCount: 2,
  speedMtS: 3200,
} as const;

const ddr5MemoryKit = {
  id: "memory-ddr5",
  kind: "memoryKit",
  brand: "G.Skill",
  model: "Ripjaws S5",
  memoryType: "DDR5",
  capacityGb: 32,
  moduleCount: 2,
  speedMtS: 6000,
} as const;

describe("checkMemoryMotherboardCompatibility", () => {
  it("accepts DDR4 memory on a DDR4 motherboard", () => {
    expect(
      checkMemoryMotherboardCompatibility(ddr4MemoryKit, ddr4Motherboard),
    ).toEqual({ compatible: true });
  });

  it("accepts DDR5 memory on a DDR5 motherboard", () => {
    expect(
      checkMemoryMotherboardCompatibility(ddr5MemoryKit, ddr5Motherboard),
    ).toEqual({ compatible: true });
  });

  it("rejects DDR5 memory on a DDR4 motherboard", () => {
    expect(
      checkMemoryMotherboardCompatibility(ddr5MemoryKit, ddr4Motherboard),
    ).toEqual({
      compatible: false,
      reason: {
        code: "MEMORY_TYPE_MISMATCH",
        memoryType: "DDR5",
        motherboardMemoryType: "DDR4",
      },
    });
  });

  it("rejects DDR4 memory on a DDR5 motherboard", () => {
    expect(
      checkMemoryMotherboardCompatibility(ddr4MemoryKit, ddr5Motherboard),
    ).toEqual({
      compatible: false,
      reason: {
        code: "MEMORY_TYPE_MISMATCH",
        memoryType: "DDR4",
        motherboardMemoryType: "DDR5",
      },
    });
  });
});

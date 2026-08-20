import { describe, expect, it } from "vitest";

import { checkCpuCoolerCaseCompatibility } from "./cpu-cooler-case";

const cpuCooler = {
  id: "cpu-cooler-test",
  kind: "cpuCooler",
  brand: "Test",
  model: "Tower",
  supportedSockets: ["AM4", "AM5"],
  heightMm: 150,
} as const;

const pcCase = {
  id: "case-test",
  kind: "case",
  brand: "Test",
  model: "Case",
  supportedMotherboardFormFactors: ["ATX", "MicroATX"],
  maxGpuLengthMm: 300,
  maxCpuCoolerHeightMm: 150,
} as const;

describe("checkCpuCoolerCaseCompatibility", () => {
  it("accepts a cooler shorter than the case limit", () => {
    expect(
      checkCpuCoolerCaseCompatibility(
        { ...cpuCooler, heightMm: 149 },
        { ...pcCase, maxCpuCoolerHeightMm: 150 },
      ),
    ).toEqual({ compatible: true });
  });

  it("accepts a cooler exactly at the case limit", () => {
    expect(checkCpuCoolerCaseCompatibility(cpuCooler, pcCase)).toEqual({
      compatible: true,
    });
  });

  it("rejects a cooler one millimeter taller than the case limit", () => {
    expect(
      checkCpuCoolerCaseCompatibility(
        { ...cpuCooler, heightMm: 151 },
        { ...pcCase, maxCpuCoolerHeightMm: 150 },
      ),
    ).toEqual({
      compatible: false,
      reason: {
        code: "CPU_COOLER_HEIGHT_EXCEEDED",
        cpuCoolerHeightMm: 151,
        maxCpuCoolerHeightMm: 150,
      },
    });
  });
});

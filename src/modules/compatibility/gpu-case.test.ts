import { describe, expect, it } from "vitest";

import { checkGpuCaseCompatibility } from "./gpu-case";

const gpu = {
  id: "gpu-test",
  kind: "gpu",
  brand: "Test",
  model: "Test GPU",
  chipBrand: "NVIDIA",
  gpuModel: "Test GPU",
  boardBrand: "Test",
  boardModel: "Test GPU",
  vramGb: 8,
  boardPowerWatts: 150,
  lengthMm: 300,
  powerConnectors: [],
} as const;

const pcCase = {
  id: "case-test",
  kind: "case",
  brand: "Test",
  model: "Case",
  supportedMotherboardFormFactors: ["ATX", "MicroATX"],
  maxGpuLengthMm: 300,
} as const;

describe("checkGpuCaseCompatibility", () => {
  it("accepts a GPU shorter than the case limit", () => {
    expect(
      checkGpuCaseCompatibility(
        { ...gpu, lengthMm: 299 },
        { ...pcCase, maxGpuLengthMm: 300 },
      ),
    ).toEqual({ compatible: true });
  });

  it("accepts a GPU exactly at the case limit", () => {
    expect(checkGpuCaseCompatibility(gpu, pcCase)).toEqual({
      compatible: true,
    });
  });

  it("rejects a GPU longer than the case limit", () => {
    expect(
      checkGpuCaseCompatibility(
        { ...gpu, lengthMm: 301 },
        { ...pcCase, maxGpuLengthMm: 300 },
      ),
    ).toEqual({
      compatible: false,
      reason: {
        code: "GPU_LENGTH_EXCEEDED",
        gpuLengthMm: 301,
        maxGpuLengthMm: 300,
      },
    });
  });
});

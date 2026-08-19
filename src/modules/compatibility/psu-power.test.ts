import { describe, expect, it } from "vitest";

import {
  checkPsuPowerCompatibility,
  estimateCpuGpuLoadWatts,
  getRequiredPsuWatts,
} from "./psu-power";

const cpu = {
  id: "cpu-1",
  kind: "cpu",
  brand: "AMD",
  model: "Ryzen 7",
  socket: "AM5",
  cores: 8,
  threads: 16,
  tdpWatts: 120,
} as const;

const gpu = {
  id: "gpu-1",
  kind: "gpu",
  brand: "PowerColor",
  model: "Fighter Radeon RX 7800 XT",
  chipBrand: "AMD",
  gpuModel: "Radeon RX 7800 XT",
  boardBrand: "PowerColor",
  boardModel: "Fighter",
  vramGb: 16,
  boardPowerWatts: 263,
  lengthMm: 303,
} as const;

describe("checkPsuPowerCompatibility", () => {
  it("estimates load from CPU TDP and GPU board power", () => {
    expect(estimateCpuGpuLoadWatts(cpu, gpu)).toBe(383);
  });

  it("adds a 25 percent headroom and rounds up", () => {
    expect(getRequiredPsuWatts(383)).toBe(479);
  });

  it("accepts a PSU at the exact required wattage boundary", () => {
    expect(
      checkPsuPowerCompatibility(cpu, gpu, {
        id: "psu-boundary",
        kind: "psu",
        brand: "Test",
        model: "Boundary 479W",
        wattage: 479,
      }),
    ).toEqual({
      compatible: true,
      psuWattage: 479,
      estimatedLoadWatts: 383,
      requiredPsuWatts: 479,
    });
  });

  it("accepts a PSU above the required wattage", () => {
    expect(
      checkPsuPowerCompatibility(cpu, gpu, {
        id: "psu-650",
        kind: "psu",
        brand: "Corsair",
        model: "CX650",
        wattage: 650,
      }).compatible,
    ).toBe(true);
  });

  it("rejects a PSU below the required wattage", () => {
    expect(
      checkPsuPowerCompatibility(cpu, gpu, {
        id: "psu-450",
        kind: "psu",
        brand: "Test",
        model: "Small 450W",
        wattage: 450,
      }),
    ).toEqual({
      compatible: false,
      reason: {
        code: "INSUFFICIENT_WATTAGE",
        psuWattage: 450,
        estimatedLoadWatts: 383,
        requiredPsuWatts: 479,
      },
    });
  });
});

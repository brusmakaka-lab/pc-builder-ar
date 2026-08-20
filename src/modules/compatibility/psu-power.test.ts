import { describe, expect, it } from "vitest";

import {
  checkPsuPowerCompatibility,
  estimateComponentLoadWatts,
  estimatePsuPower,
  getEstimatedLoadWatts,
  getRequiredPsuWatts,
  PSU_HEADROOM_RATIO,
  SYSTEM_BASE_POWER_WATTS,
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
  powerConnectors: [{ type: "pcie-8", count: 2 }],
} as const;

describe("checkPsuPowerCompatibility", () => {
  it("estimates load from CPU TDP and GPU board power", () => {
    expect(estimateComponentLoadWatts(cpu, gpu)).toBe(383);
  });

  it("applies the system base constant", () => {
    expect(SYSTEM_BASE_POWER_WATTS).toBe(100);
    expect(getEstimatedLoadWatts(383)).toBe(483);
  });

  it("adds headroom after the system base and rounds up", () => {
    expect(PSU_HEADROOM_RATIO).toBe(1.25);
    expect(getRequiredPsuWatts(483)).toBe(604);
  });

  it("returns a structured PSU power estimate", () => {
    expect(estimatePsuPower(cpu, gpu)).toEqual({
      cpuWatts: 120,
      gpuWatts: 263,
      systemBaseWatts: 100,
      estimatedComponentWatts: 383,
      estimatedLoadWatts: 483,
      headroomRatio: 1.25,
      requiredPsuWatts: 604,
    });
  });

  it("covers the documented 65 W CPU plus 200 W GPU example", () => {
    const exampleGpu = {
      ...gpu,
      boardPowerWatts: 200,
    };

    expect(estimatePsuPower({ ...cpu, tdpWatts: 65 }, exampleGpu)).toMatchObject({
      estimatedComponentWatts: 265,
      estimatedLoadWatts: 365,
      requiredPsuWatts: 457,
    });
  });

  it("accepts a PSU at the exact required wattage boundary", () => {
    expect(
      checkPsuPowerCompatibility(cpu, gpu, {
        id: "psu-boundary",
        kind: "psu",
        brand: "Test",
        model: "Boundary 604W",
        wattage: 604,
        gpuPowerConnectors: [],
      }),
    ).toEqual({
      compatible: true,
      psuWattage: 604,
      estimate: {
        cpuWatts: 120,
        gpuWatts: 263,
        systemBaseWatts: 100,
        estimatedComponentWatts: 383,
        estimatedLoadWatts: 483,
        headroomRatio: 1.25,
        requiredPsuWatts: 604,
      },
    });
  });

  it("rejects a PSU one watt below the required wattage", () => {
    expect(
      checkPsuPowerCompatibility(cpu, gpu, {
        id: "psu-603",
        kind: "psu",
        brand: "Test",
        model: "Almost 603W",
        wattage: 603,
        gpuPowerConnectors: [],
      }).compatible,
    ).toBe(false);
  });

  it("accepts a PSU above the required wattage", () => {
    expect(
      checkPsuPowerCompatibility(cpu, gpu, {
        id: "psu-650",
        kind: "psu",
        brand: "Corsair",
        model: "CX650",
        wattage: 650,
        gpuPowerConnectors: [],
      }).compatible,
    ).toBe(true);
  });

  it("rejects a PSU below the required wattage", () => {
    expect(
      checkPsuPowerCompatibility(cpu, gpu, {
        id: "psu-500",
        kind: "psu",
        brand: "Test",
        model: "Small 500W",
        wattage: 500,
        gpuPowerConnectors: [],
      }),
    ).toEqual({
      compatible: false,
      reason: {
        code: "INSUFFICIENT_WATTAGE",
        psuWattage: 500,
        estimate: {
          cpuWatts: 120,
          gpuWatts: 263,
          systemBaseWatts: 100,
          estimatedComponentWatts: 383,
          estimatedLoadWatts: 483,
          headroomRatio: 1.25,
          requiredPsuWatts: 604,
        },
      },
    });
  });

  it("rejects 400 W and accepts 500 W for the documented example", () => {
    const exampleCpu = { ...cpu, tdpWatts: 65 };
    const exampleGpu = { ...gpu, boardPowerWatts: 200 };

    expect(
      checkPsuPowerCompatibility(exampleCpu, exampleGpu, {
        id: "psu-400",
        kind: "psu",
        brand: "Test",
        model: "400W",
        wattage: 400,
        gpuPowerConnectors: [],
      }).compatible,
    ).toBe(false);
    expect(
      checkPsuPowerCompatibility(exampleCpu, exampleGpu, {
        id: "psu-500",
        kind: "psu",
        brand: "Test",
        model: "500W",
        wattage: 500,
        gpuPowerConnectors: [],
      }).compatible,
    ).toBe(true);
  });

  it("does not let GPU connector requirements alter wattage estimation", () => {
    expect(estimatePsuPower(cpu, { ...gpu, powerConnectors: [] })).toEqual(
      estimatePsuPower(cpu, {
        ...gpu,
        powerConnectors: [{ type: "12vhpwr", count: 1 }],
      }),
    );
  });
});

import { describe, expect, it } from "vitest";

import { checkGpuPsuConnectorCompatibility } from "./gpu-psu-connectors";

const baseGpu = {
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
  lengthMm: 250,
} as const;

const basePsu = {
  id: "psu-test",
  kind: "psu",
  brand: "Test",
  model: "Test PSU",
  wattage: 650,
} as const;

describe("checkGpuPsuConnectorCompatibility", () => {
  it("accepts a GPU without dedicated power connectors", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [] },
        { ...basePsu, gpuPowerConnectors: [] },
      ),
    ).toEqual({
      compatible: true,
      missingConnectors: [],
    });
  });

  it("accepts 1x PCIe 8-pin required and 1x PCIe 8-pin available", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 1 }] },
        { ...basePsu, gpuPowerConnectors: [{ type: "pcie-8", count: 1 }] },
      ).compatible,
    ).toBe(true);
  });

  it("rejects 1x PCIe 8-pin required and none available", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 1 }] },
        { ...basePsu, gpuPowerConnectors: [] },
      ),
    ).toEqual({
      compatible: false,
      reason: {
        code: "MISSING_GPU_POWER_CONNECTORS",
        missingConnectors: [{ type: "pcie-8", count: 1 }],
      },
    });
  });

  it("rejects 2x PCIe 8-pin required and 1x PCIe 8-pin available", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 2 }] },
        { ...basePsu, gpuPowerConnectors: [{ type: "pcie-8", count: 1 }] },
      ),
    ).toEqual({
      compatible: false,
      reason: {
        code: "MISSING_GPU_POWER_CONNECTORS",
        missingConnectors: [{ type: "pcie-8", count: 1 }],
      },
    });
  });

  it("accepts 2x PCIe 8-pin required and 2x PCIe 8-pin available", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 2 }] },
        { ...basePsu, gpuPowerConnectors: [{ type: "pcie-8", count: 2 }] },
      ).compatible,
    ).toBe(true);
  });

  it("accepts extra connector capacity", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 1 }] },
        { ...basePsu, gpuPowerConnectors: [{ type: "pcie-8", count: 3 }] },
      ).compatible,
    ).toBe(true);
  });

  it("does not satisfy a requirement with the wrong connector type", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 1 }] },
        { ...basePsu, gpuPowerConnectors: [{ type: "pcie-6", count: 1 }] },
      ).compatible,
    ).toBe(false);
  });

  it("reports the missing connector count", () => {
    const result = checkGpuPsuConnectorCompatibility(
      {
        ...baseGpu,
        powerConnectors: [
          { type: "pcie-8", count: 2 },
          { type: "12vhpwr", count: 1 },
        ],
      },
      { ...basePsu, gpuPowerConnectors: [{ type: "pcie-8", count: 1 }] },
    );

    expect(result).toEqual({
      compatible: false,
      reason: {
        code: "MISSING_GPU_POWER_CONNECTORS",
        missingConnectors: [
          { type: "pcie-8", count: 1 },
          { type: "12vhpwr", count: 1 },
        ],
      },
    });
  });

  it("does not mutate the GPU", () => {
    const gpu = {
      ...baseGpu,
      powerConnectors: [{ type: "pcie-8", count: 1 }],
    } as const;
    const before = { ...gpu, powerConnectors: [...gpu.powerConnectors] };

    checkGpuPsuConnectorCompatibility(gpu, {
      ...basePsu,
      gpuPowerConnectors: [{ type: "pcie-8", count: 1 }],
    });

    expect(gpu).toEqual(before);
  });

  it("does not mutate the PSU", () => {
    const psu = {
      ...basePsu,
      gpuPowerConnectors: [{ type: "pcie-8", count: 1 }],
    } as const;
    const before = { ...psu, gpuPowerConnectors: [...psu.gpuPowerConnectors] };

    checkGpuPsuConnectorCompatibility(
      { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 1 }] },
      psu,
    );

    expect(psu).toEqual(before);
  });

  it("allows PCIe 6+2 to satisfy a PCIe 6-pin requirement", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-6", count: 1 }] },
        {
          ...basePsu,
          gpuPowerConnectors: [{ type: "pcie-6-plus-2", count: 1 }],
        },
      ).compatible,
    ).toBe(true);
  });

  it("allows PCIe 6+2 to satisfy a PCIe 8-pin requirement", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 1 }] },
        {
          ...basePsu,
          gpuPowerConnectors: [{ type: "pcie-6-plus-2", count: 1 }],
        },
      ).compatible,
    ).toBe(true);
  });

  it("does not use one PCIe 6+2 connector for two simultaneous requirements", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "pcie-8", count: 2 }] },
        {
          ...basePsu,
          gpuPowerConnectors: [{ type: "pcie-6-plus-2", count: 1 }],
        },
      ),
    ).toEqual({
      compatible: false,
      reason: {
        code: "MISSING_GPU_POWER_CONNECTORS",
        missingConnectors: [{ type: "pcie-8", count: 1 }],
      },
    });
  });

  it("accepts native 12VHPWR for a 12VHPWR requirement", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "12vhpwr", count: 1 }] },
        { ...basePsu, gpuPowerConnectors: [{ type: "12vhpwr", count: 1 }] },
      ).compatible,
    ).toBe(true);
  });

  it("does not convert multiple PCIe 8-pin connectors into 12VHPWR", () => {
    expect(
      checkGpuPsuConnectorCompatibility(
        { ...baseGpu, powerConnectors: [{ type: "12vhpwr", count: 1 }] },
        { ...basePsu, gpuPowerConnectors: [{ type: "pcie-8", count: 4 }] },
      ),
    ).toEqual({
      compatible: false,
      reason: {
        code: "MISSING_GPU_POWER_CONNECTORS",
        missingConnectors: [{ type: "12vhpwr", count: 1 }],
      },
    });
  });
});

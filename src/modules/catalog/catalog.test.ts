import { describe, expect, it } from "vitest";

import {
  getAllCatalogComponents,
  getAllCpus,
  getAllGpus,
  getAllMemoryKits,
  getAllMotherboards,
  getAllPsus,
} from "./catalog";

describe("catalog fixtures", () => {
  it("uses unique component ids across the catalog", () => {
    const ids = getAllCatalogComponents().map((component) => component.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exposes all supported component groups", () => {
    expect(getAllCpus().length).toBeGreaterThan(0);
    expect(getAllMotherboards().length).toBeGreaterThan(0);
    expect(getAllGpus().length).toBeGreaterThan(0);
    expect(getAllMemoryKits().length).toBeGreaterThan(0);
    expect(getAllPsus().length).toBeGreaterThan(0);
  });

  it("keeps CPU specs usable for comparison", () => {
    expect(
      getAllCpus().every(
        (cpu) =>
          cpu.cores > 0 && cpu.threads >= cpu.cores && cpu.tdpWatts > 0,
      ),
    ).toBe(true);
  });

  it("keeps motherboard specs usable for selection", () => {
    expect(
      getAllMotherboards().every(
        (motherboard) =>
          motherboard.memorySlots > 0 &&
          motherboard.chipset.length > 0 &&
          motherboard.memoryType.length > 0,
      ),
    ).toBe(true);
  });

  it("keeps GPU specs usable for comparison", () => {
    expect(
      getAllGpus().every(
        (gpu) =>
          gpu.vramGb > 0 && gpu.boardPowerWatts > 0 && gpu.lengthMm > 0,
      ),
    ).toBe(true);
  });

  it("models RAM as memory kits with explicit units", () => {
    expect(
      getAllMemoryKits().every(
        (memoryKit) =>
          memoryKit.capacityGb > 0 &&
          memoryKit.moduleCount > 0 &&
          memoryKit.speedMtS > 0,
      ),
    ).toBe(true);
  });

  it("models PSUs with explicit wattage", () => {
    expect(
      getAllPsus().every((psu) => psu.brand.length > 0 && psu.wattage > 0),
    ).toBe(true);
  });
});

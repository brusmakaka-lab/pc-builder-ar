import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getAllCpus,
  getAllGpus,
  getAllMemoryKits,
  getAllMotherboards,
  getAllPsus,
} from "../catalog/catalog";

import {
  createEmptyBuild,
  selectCpu,
  selectGpu,
  selectMemoryKit,
  selectMotherboard,
  selectPsu,
} from "./build";
import {
  evaluateBuild,
  evaluateCpuMotherboardCompatibility,
  evaluateGpuPsuConnectorCompatibility,
  evaluateMemoryMotherboardCompatibility,
  evaluatePsuPowerCompatibility,
} from "./evaluate";

const catalog = {
  cpus: getAllCpus(),
  motherboards: getAllMotherboards(),
  gpus: getAllGpus(),
  memoryKits: getAllMemoryKits(),
  psus: getAllPsus(),
};

describe("evaluateCpuMotherboardCompatibility", () => {
  it("returns compatible for a build with matching CPU and motherboard sockets", () => {
    const build = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-msi-b650-tomahawk-wifi",
    );

    expect(evaluateCpuMotherboardCompatibility(build, catalog)).toEqual({
      compatible: true,
    });
  });

  it("returns incompatible after changing to a mismatched motherboard", () => {
    const build = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-asus-prime-b550m-a",
    );

    expect(evaluateCpuMotherboardCompatibility(build, catalog)).toEqual({
      compatible: false,
      reason: {
        code: "SOCKET_MISMATCH",
        cpuSocket: "AM5",
        motherboardSocket: "AM4",
      },
    });
  });

  it("keeps incompatible selections in the build", () => {
    const build = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-asus-prime-b550m-a",
    );

    expect(build.cpuId).toBe("cpu-amd-ryzen-5-7600");
    expect(build.motherboardId).toBe("motherboard-asus-prime-b550m-a");
    expect(evaluateCpuMotherboardCompatibility(build, catalog)?.compatible).toBe(
      false,
    );
  });

  it("does not change CPU motherboard compatibility when GPU or RAM changes", () => {
    const baseBuild = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-msi-b650-tomahawk-wifi",
    );
    const withGpu = selectGpu(baseBuild, getAllGpus()[0].id);
    const withMemory = selectMemoryKit(withGpu, getAllMemoryKits()[0].id);

    expect(evaluateCpuMotherboardCompatibility(baseBuild, catalog)).toEqual(
      evaluateCpuMotherboardCompatibility(withGpu, catalog),
    );
    expect(evaluateCpuMotherboardCompatibility(baseBuild, catalog)).toEqual(
      evaluateCpuMotherboardCompatibility(withMemory, catalog),
    );
  });
});

describe("evaluateMemoryMotherboardCompatibility", () => {
  it("returns compatible for a DDR4 motherboard and DDR4 RAM", () => {
    const build = selectMemoryKit(
      selectMotherboard(createEmptyBuild(), "motherboard-asus-prime-b550m-a"),
      "memory-corsair-vengeance-lpx-16gb-2x8-ddr4-3200",
    );

    expect(evaluateMemoryMotherboardCompatibility(build, catalog)).toEqual({
      compatible: true,
    });
  });

  it("returns compatible for a DDR5 motherboard and DDR5 RAM", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        createEmptyBuild(),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateMemoryMotherboardCompatibility(build, catalog)).toEqual({
      compatible: true,
    });
  });

  it("returns incompatible for a DDR4 motherboard and DDR5 RAM", () => {
    const build = selectMemoryKit(
      selectMotherboard(createEmptyBuild(), "motherboard-asus-prime-b550m-a"),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateMemoryMotherboardCompatibility(build, catalog)).toEqual({
      compatible: false,
      reason: {
        code: "MEMORY_TYPE_MISMATCH",
        memoryType: "DDR5",
        motherboardMemoryType: "DDR4",
      },
    });
  });

  it("returns incompatible for a DDR5 motherboard and DDR4 RAM", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        createEmptyBuild(),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "memory-corsair-vengeance-lpx-16gb-2x8-ddr4-3200",
    );

    expect(evaluateMemoryMotherboardCompatibility(build, catalog)).toEqual({
      compatible: false,
      reason: {
        code: "MEMORY_TYPE_MISMATCH",
        memoryType: "DDR4",
        motherboardMemoryType: "DDR5",
      },
    });
  });

  it("returns unknown when the motherboard is absent", () => {
    const build = selectMemoryKit(
      createEmptyBuild(),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateMemoryMotherboardCompatibility(build, catalog)).toBeNull();
  });

  it("returns unknown when RAM is absent", () => {
    const build = selectMotherboard(
      createEmptyBuild(),
      "motherboard-msi-b650-tomahawk-wifi",
    );

    expect(evaluateMemoryMotherboardCompatibility(build, catalog)).toBeNull();
  });

  it("does not mutate the original build", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        createEmptyBuild(),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );
    const before = { ...build };

    evaluateMemoryMotherboardCompatibility(build, catalog);

    expect(build).toEqual(before);
  });

  it("does not mutate the catalog", () => {
    const before = {
      motherboardIds: catalog.motherboards.map((motherboard) => motherboard.id),
      memoryKitIds: catalog.memoryKits.map((memoryKit) => memoryKit.id),
    };

    evaluateMemoryMotherboardCompatibility(createEmptyBuild(), catalog);

    expect({
      motherboardIds: catalog.motherboards.map((motherboard) => motherboard.id),
      memoryKitIds: catalog.memoryKits.map((memoryKit) => memoryKit.id),
    }).toEqual(before);
  });
});

describe("evaluatePsuPowerCompatibility", () => {
  it("returns unknown when PSU is absent", () => {
    const build = selectGpu(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "gpu-asus-prime-rtx-5070-oc",
    );

    expect(evaluatePsuPowerCompatibility(build, catalog)).toBeNull();
  });

  it("returns unknown when CPU is absent", () => {
    const build = selectPsu(
      selectGpu(createEmptyBuild(), "gpu-asus-prime-rtx-5070-oc"),
      "psu-corsair-cx650-650w",
    );

    expect(evaluatePsuPowerCompatibility(build, catalog)).toBeNull();
  });

  it("returns unknown when GPU is absent", () => {
    const build = selectPsu(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "psu-corsair-cx650-650w",
    );

    expect(evaluatePsuPowerCompatibility(build, catalog)).toBeNull();
  });

  it("returns compatible when PSU wattage covers the required estimate", () => {
    const build = selectPsu(
      selectGpu(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "gpu-asus-prime-rtx-5070-oc",
      ),
      "psu-corsair-cx650-650w",
    );

    expect(evaluatePsuPowerCompatibility(build, catalog)).toEqual({
      compatible: true,
      psuWattage: 650,
      estimatedLoadWatts: 315,
      requiredPsuWatts: 394,
    });
  });

  it("returns incompatible when PSU wattage is below the required estimate", () => {
    const build = selectPsu(
      selectGpu(
        selectCpu(createEmptyBuild(), "cpu-intel-core-i5-14600k"),
        "gpu-asus-prime-rtx-5070-oc",
      ),
      "psu-test-400w",
    );
    const testCatalog = {
      ...catalog,
      psus: [
        ...catalog.psus,
        {
          id: "psu-test-400w",
          kind: "psu",
          brand: "Test",
          model: "Small 400W",
          wattage: 400,
          gpuPowerConnectors: [],
        } as const,
      ],
    };

    expect(evaluatePsuPowerCompatibility(build, testCatalog)).toEqual({
      compatible: false,
      reason: {
        code: "INSUFFICIENT_WATTAGE",
        psuWattage: 400,
        estimatedLoadWatts: 375,
        requiredPsuWatts: 469,
      },
    });
  });

  it("does not mutate the original build", () => {
    const build = selectPsu(
      selectGpu(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "gpu-asus-prime-rtx-5070-oc",
      ),
      "psu-corsair-cx650-650w",
    );
    const before = { ...build };

    evaluatePsuPowerCompatibility(build, catalog);

    expect(build).toEqual(before);
  });

  it("does not mutate the catalog", () => {
    const before = {
      cpuIds: catalog.cpus.map((cpu) => cpu.id),
      gpuIds: catalog.gpus.map((gpu) => gpu.id),
      psuIds: catalog.psus.map((psu) => psu.id),
    };

    evaluatePsuPowerCompatibility(createEmptyBuild(), catalog);

    expect({
      cpuIds: catalog.cpus.map((cpu) => cpu.id),
      gpuIds: catalog.gpus.map((gpu) => gpu.id),
      psuIds: catalog.psus.map((psu) => psu.id),
    }).toEqual(before);
  });
});

describe("evaluateGpuPsuConnectorCompatibility", () => {
  it("returns unknown when GPU is absent", () => {
    const build = selectPsu(createEmptyBuild(), "psu-corsair-cx650-650w");

    expect(evaluateGpuPsuConnectorCompatibility(build, catalog)).toBeNull();
  });

  it("returns unknown when PSU is absent", () => {
    const build = selectGpu(createEmptyBuild(), "gpu-sapphire-pulse-rx-7600");

    expect(evaluateGpuPsuConnectorCompatibility(build, catalog)).toBeNull();
  });

  it("returns compatible when GPU and PSU connectors match", () => {
    const build = selectPsu(
      selectGpu(createEmptyBuild(), "gpu-sapphire-pulse-rx-7600"),
      "psu-aerocool-cylon-500w",
    );

    expect(evaluateGpuPsuConnectorCompatibility(build, catalog)).toEqual({
      compatible: true,
      missingConnectors: [],
    });
  });

  it("returns compatible for a GPU without dedicated power connectors", () => {
    const build = selectPsu(
      selectGpu(createEmptyBuild(), "gpu-msi-rtx-4060-ventus-2x"),
      "psu-generic-400w",
    );

    expect(evaluateGpuPsuConnectorCompatibility(build, catalog)).toEqual({
      compatible: true,
      missingConnectors: [],
    });
  });

  it("returns incompatible when PSU connectors are insufficient", () => {
    const build = selectPsu(
      selectGpu(createEmptyBuild(), "gpu-powercolor-fighter-rx-7800-xt"),
      "psu-aerocool-cylon-500w",
    );

    expect(evaluateGpuPsuConnectorCompatibility(build, catalog)).toEqual({
      compatible: false,
      reason: {
        code: "MISSING_GPU_POWER_CONNECTORS",
        missingConnectors: [{ type: "pcie-8", count: 1 }],
      },
    });
  });

  it("does not mutate the original build", () => {
    const build = selectPsu(
      selectGpu(createEmptyBuild(), "gpu-powercolor-fighter-rx-7800-xt"),
      "psu-corsair-cx650-650w",
    );
    const before = { ...build };

    evaluateGpuPsuConnectorCompatibility(build, catalog);

    expect(build).toEqual(before);
  });

  it("does not mutate the catalog", () => {
    const before = {
      gpuConnectors: catalog.gpus.map((gpu) => gpu.powerConnectors),
      psuConnectors: catalog.psus.map((psu) => psu.gpuPowerConnectors),
    };

    evaluateGpuPsuConnectorCompatibility(createEmptyBuild(), catalog);

    expect({
      gpuConnectors: catalog.gpus.map((gpu) => gpu.powerConnectors),
      psuConnectors: catalog.psus.map((psu) => psu.gpuPowerConnectors),
    }).toEqual(before);
  });
});

describe("evaluateBuild", () => {
  it("evaluates an empty build", () => {
    expect(evaluateBuild(createEmptyBuild(), catalog)).toEqual({
      completion: "empty",
      compatibility: "unknown",
      missingComponents: ["cpu", "motherboard", "gpu", "memoryKit", "psu"],
      issues: [],
      power: {
        estimatedLoadWatts: null,
        requiredPsuWatts: null,
      },
    });
  });

  it("evaluates a build with only CPU selected", () => {
    expect(
      evaluateBuild(selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"), catalog),
    ).toEqual({
      completion: "partial",
      compatibility: "unknown",
      missingComponents: ["motherboard", "gpu", "memoryKit", "psu"],
      issues: [],
      power: {
        estimatedLoadWatts: null,
        requiredPsuWatts: null,
      },
    });
  });

  it("evaluates a build with only motherboard selected", () => {
    expect(
      evaluateBuild(
        selectMotherboard(
          createEmptyBuild(),
          "motherboard-msi-b650-tomahawk-wifi",
        ),
        catalog,
      ),
    ).toEqual({
      completion: "partial",
      compatibility: "unknown",
      missingComponents: ["cpu", "gpu", "memoryKit", "psu"],
      issues: [],
      power: {
        estimatedLoadWatts: null,
        requiredPsuWatts: null,
      },
    });
  });

  it("evaluates compatible CPU and motherboard selections", () => {
    const build = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-msi-b650-tomahawk-wifi",
    );

    expect(evaluateBuild(build, catalog)).toMatchObject({
      completion: "partial",
      compatibility: "unknown",
      missingComponents: ["gpu", "memoryKit", "psu"],
      issues: [],
    });
  });

  it("evaluates incompatible CPU and motherboard selections", () => {
    const build = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-asus-prime-b550m-a",
    );

    expect(evaluateBuild(build, catalog)).toEqual({
      completion: "partial",
      compatibility: "incompatible",
      missingComponents: ["gpu", "memoryKit", "psu"],
      issues: [
        {
          code: "cpu-motherboard-socket-mismatch",
          severity: "error",
          message: "La CPU utiliza AM5 y la motherboard utiliza AM4.",
        },
      ],
      power: {
        estimatedLoadWatts: null,
        requiredPsuWatts: null,
      },
    });
  });

  it("evaluates CPU motherboard and GPU as partial", () => {
    const build = selectGpu(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "gpu-asus-prime-rtx-5070-oc",
    );

    expect(evaluateBuild(build, catalog)).toMatchObject({
      completion: "partial",
      compatibility: "unknown",
      missingComponents: ["memoryKit", "psu"],
    });
  });

  it("evaluates motherboard and RAM compatibility as unknown when CPU is absent", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        createEmptyBuild(),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateBuild(build, catalog)).toMatchObject({
      completion: "partial",
      compatibility: "unknown",
      missingComponents: ["cpu", "gpu", "psu"],
      issues: [],
    });
  });

  it("evaluates CPU motherboard and RAM compatibility without GPU as unknown", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateBuild(build, catalog)).toMatchObject({
      completion: "partial",
      compatibility: "unknown",
      missingComponents: ["gpu", "psu"],
      issues: [],
    });
  });

  it("evaluates a complete compatible build", () => {
    const build = selectPsu(
      selectMemoryKit(
        selectGpu(
          selectMotherboard(
            selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
            "motherboard-msi-b650-tomahawk-wifi",
          ),
          "gpu-asus-prime-rtx-5070-oc",
        ),
        "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
      ),
      "psu-seasonic-focus-gx-750w",
    );

    expect(evaluateBuild(build, catalog)).toEqual({
      completion: "complete",
      compatibility: "compatible",
      missingComponents: [],
      issues: [],
      power: {
        estimatedLoadWatts: 315,
        requiredPsuWatts: 394,
      },
    });
  });

  it("returns missing components in deterministic order without duplicates", () => {
    const build = selectGpu(createEmptyBuild(), "gpu-asus-prime-rtx-5070-oc");

    expect(evaluateBuild(build, catalog).missingComponents).toEqual([
      "cpu",
      "motherboard",
      "memoryKit",
      "psu",
    ]);
  });

  it("uses stable issue codes for incompatible builds", () => {
    const build = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-asus-prime-b550m-a",
    );

    expect(evaluateBuild(build, catalog).issues.map((issue) => issue.code)).toEqual(
      ["cpu-motherboard-socket-mismatch"],
    );
  });

  it("keeps incompatible when CPU motherboard fails and RAM motherboard passes", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-asus-prime-b550m-a",
      ),
      "memory-corsair-vengeance-lpx-16gb-2x8-ddr4-3200",
    );

    expect(evaluateBuild(build, catalog).compatibility).toBe("incompatible");
    expect(evaluateBuild(build, catalog).issues.map((issue) => issue.code)).toEqual(
      ["cpu-motherboard-socket-mismatch"],
    );
  });

  it("keeps incompatible when CPU motherboard passes and RAM motherboard fails", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "memory-corsair-vengeance-lpx-16gb-2x8-ddr4-3200",
    );

    expect(evaluateBuild(build, catalog).compatibility).toBe("incompatible");
    expect(evaluateBuild(build, catalog).issues.map((issue) => issue.code)).toEqual(
      ["memory-motherboard-type-mismatch"],
    );
  });

  it("keeps incompatible when both known compatibility checks fail", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-asus-prime-b550m-a",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateBuild(build, catalog).compatibility).toBe("incompatible");
  });

  it("keeps incompatible when PSU power fails", () => {
    const build = selectPsu(
      selectMemoryKit(
        selectGpu(
          selectMotherboard(
            selectCpu(createEmptyBuild(), "cpu-intel-core-i5-14600k"),
            "motherboard-asus-prime-b760-plus",
          ),
          "gpu-asus-prime-rtx-5070-oc",
        ),
        "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
      ),
      "psu-test-400w-12vhpwr",
    );
    const testCatalog = {
      ...catalog,
      psus: [
        ...catalog.psus,
        {
          id: "psu-test-400w-12vhpwr",
          kind: "psu",
          brand: "Test",
          model: "Native 12VHPWR 400W",
          wattage: 400,
          gpuPowerConnectors: [{ type: "12vhpwr", count: 1 }],
        } as const,
      ],
    };

    expect(evaluateBuild(build, testCatalog).compatibility).toBe("incompatible");
    expect(evaluateBuild(build, testCatalog).issues.map((issue) => issue.code)).toEqual(
      ["psu-insufficient-wattage"],
    );
  });

  it("reports multiple incompatibilities as issues", () => {
    const build = selectPsu(
      selectMemoryKit(
        selectGpu(
          selectMotherboard(
            selectCpu(createEmptyBuild(), "cpu-intel-core-i5-14600k"),
            "motherboard-asus-prime-b550m-a",
          ),
          "gpu-asus-prime-rtx-5070-oc",
        ),
        "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
      ),
      "psu-generic-400w",
    );

    expect(evaluateBuild(build, catalog).issues).toEqual([
      {
        code: "cpu-motherboard-socket-mismatch",
        severity: "error",
        message: "La CPU utiliza LGA1700 y la motherboard utiliza AM4.",
      },
      {
        code: "memory-motherboard-type-mismatch",
        severity: "error",
        message: "La RAM utiliza DDR5 y la motherboard utiliza DDR4.",
      },
      {
        code: "psu-insufficient-wattage",
        severity: "error",
        message: "La PSU entrega 400 W y la build requiere al menos 469 W estimados.",
      },
      {
        code: "psu-missing-gpu-power-connectors",
        severity: "error",
        message:
          "La PSU no cubre los conectores dedicados requeridos por la GPU: 1x 12vhpwr.",
      },
    ]);
  });

  it("reports issues in deterministic compatibility-check order", () => {
    const build = selectPsu(
      selectMemoryKit(
        selectGpu(
          selectMotherboard(
            selectCpu(createEmptyBuild(), "cpu-intel-core-i5-14600k"),
            "motherboard-asus-prime-b550m-a",
          ),
          "gpu-asus-prime-rtx-5070-oc",
        ),
        "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
      ),
      "psu-generic-400w",
    );

    expect(evaluateBuild(build, catalog).issues.map((issue) => issue.code)).toEqual(
      [
        "cpu-motherboard-socket-mismatch",
        "memory-motherboard-type-mismatch",
        "psu-insufficient-wattage",
        "psu-missing-gpu-power-connectors",
      ],
    );
  });

  it("updates power evaluation when GPU changes", () => {
    const baseBuild = selectPsu(
      selectMemoryKit(
        selectGpu(
          selectMotherboard(
            selectCpu(createEmptyBuild(), "cpu-intel-core-i5-14600k"),
            "motherboard-asus-prime-b760-plus",
          ),
          "gpu-msi-rtx-4060-ventus-2x",
        ),
        "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
      ),
      "psu-generic-400w",
    );
    const withGpu = selectGpu(baseBuild, "gpu-asus-prime-rtx-5070-oc");

    expect(evaluateBuild(baseBuild, catalog).compatibility).toBe("compatible");
    expect(evaluateBuild(baseBuild, catalog).power).toEqual({
      estimatedLoadWatts: 240,
      requiredPsuWatts: 300,
    });
    expect(evaluateBuild(withGpu, catalog).compatibility).toBe("incompatible");
    expect(evaluateBuild(withGpu, catalog).power).toEqual({
      estimatedLoadWatts: 375,
      requiredPsuWatts: 469,
    });
  });

  it("updates power evaluation when CPU changes", () => {
    const baseBuild = selectPsu(
      selectMemoryKit(
        selectGpu(
          selectMotherboard(
            selectCpu(createEmptyBuild(), "cpu-intel-core-i5-12400f"),
            "motherboard-asus-prime-b760-plus",
          ),
          "gpu-msi-rtx-4060-ventus-2x",
        ),
        "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
      ),
      "psu-test-250w",
    );
    const withCpu = selectCpu(baseBuild, "cpu-intel-core-i5-14600k");
    const testCatalog = {
      ...catalog,
      psus: [
        ...catalog.psus,
        {
          id: "psu-test-250w",
          kind: "psu",
          brand: "Test",
          model: "Small 250W",
          wattage: 250,
          gpuPowerConnectors: [],
        } as const,
      ],
    };

    expect(evaluateBuild(baseBuild, testCatalog).compatibility).toBe("compatible");
    expect(evaluateBuild(withCpu, testCatalog).compatibility).toBe("incompatible");
  });

  it("does not mutate the original build", () => {
    const build = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-msi-b650-tomahawk-wifi",
    );
    const before = { ...build };

    evaluateBuild(build, catalog);

    expect(build).toEqual(before);
  });

  it("does not mutate the catalog", () => {
    const before = {
      cpuIds: catalog.cpus.map((cpu) => cpu.id),
      motherboardIds: catalog.motherboards.map((motherboard) => motherboard.id),
      gpuIds: catalog.gpus.map((gpu) => gpu.id),
      memoryKitIds: catalog.memoryKits.map((memoryKit) => memoryKit.id),
      psuIds: catalog.psus.map((psu) => psu.id),
    };

    evaluateBuild(createEmptyBuild(), catalog);

    expect({
      cpuIds: catalog.cpus.map((cpu) => cpu.id),
      motherboardIds: catalog.motherboards.map((motherboard) => motherboard.id),
      gpuIds: catalog.gpus.map((gpu) => gpu.id),
      memoryKitIds: catalog.memoryKits.map((memoryKit) => memoryKit.id),
      psuIds: catalog.psus.map((psu) => psu.id),
    }).toEqual(before);
  });

  it("does not change CPU motherboard compatibility when GPU or RAM changes", () => {
    const baseBuild = selectMotherboard(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "motherboard-msi-b650-tomahawk-wifi",
    );
    const withGpu = selectGpu(baseBuild, "gpu-asus-prime-rtx-5070-oc");
    const withMemory = selectMemoryKit(
      withGpu,
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateBuild(baseBuild, catalog).compatibility).toBe("unknown");
    expect(evaluateBuild(withGpu, catalog).compatibility).toBe("unknown");
    expect(evaluateBuild(withMemory, catalog).compatibility).toBe("unknown");
  });

  it("keeps socket comparison centralized in the compatibility module", () => {
    const evaluateSource = readFileSync(
      join(process.cwd(), "src/modules/builds/evaluate.ts"),
      "utf8",
    );

    expect(evaluateSource).not.toContain("socket ===");
    expect(evaluateBuild).toBeTypeOf("function");
  });

  it("keeps memory type comparison centralized in the compatibility module", () => {
    const evaluateSource = readFileSync(
      join(process.cwd(), "src/modules/builds/evaluate.ts"),
      "utf8",
    );
    const clientSource = readFileSync(
      join(process.cwd(), "src/app/_components/pc-builder-client.tsx"),
      "utf8",
    );

    expect(evaluateSource).not.toContain("memoryType ===");
    expect(clientSource).not.toContain("memoryType ===");
    expect(evaluateBuild).toBeTypeOf("function");
  });

  it("keeps wattage calculation centralized outside React", () => {
    const clientSource = readFileSync(
      join(process.cwd(), "src/app/_components/pc-builder-client.tsx"),
      "utf8",
    );

    expect(clientSource).not.toContain("tdpWatts");
    expect(clientSource).not.toContain("boardPowerWatts");
    expect(clientSource).not.toContain("requiredPsuWatts =");
    expect(evaluateBuild).toBeTypeOf("function");
  });

  it("keeps GPU PSU connector matching centralized outside React", () => {
    const clientSource = readFileSync(
      join(process.cwd(), "src/app/_components/pc-builder-client.tsx"),
      "utf8",
    );

    expect(clientSource).not.toContain("powerConnectors");
    expect(clientSource).not.toContain("gpuPowerConnectors");
    expect(clientSource).not.toContain("pcie-");
    expect(evaluateBuild).toBeTypeOf("function");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getAllCases,
  getAllCpuCoolers,
  getAllCpus,
  getAllGpus,
  getAllMemoryKits,
  getAllMotherboards,
  getAllPsus,
} from "../catalog/catalog";

import {
  createEmptyBuild,
  selectCase,
  selectCpu,
  selectCpuCooler,
  selectGpu,
  selectMemoryKit,
  selectMotherboard,
  selectPsu,
} from "./build";
import {
  evaluateBuild,
  evaluateCpuCoolerCaseCompatibility,
  evaluateCpuCoolerSocketCompatibility,
  evaluateCpuMotherboardCompatibility,
  evaluateGpuCaseCompatibility,
  evaluateGpuPsuConnectorCompatibility,
  evaluateMemoryMotherboardCompatibility,
  evaluateMotherboardCaseCompatibility,
  evaluatePsuPowerCompatibility,
} from "./evaluate";

const catalog = {
  cpus: getAllCpus(),
  cpuCoolers: getAllCpuCoolers(),
  motherboards: getAllMotherboards(),
  gpus: getAllGpus(),
  memoryKits: getAllMemoryKits(),
  psus: getAllPsus(),
  cases: getAllCases(),
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

describe("evaluateCpuCoolerSocketCompatibility", () => {
  it("returns unknown when CPU is absent", () => {
    const build = selectCpuCooler(
      createEmptyBuild(),
      "cpu-cooler-deepcool-ag400",
    );

    expect(evaluateCpuCoolerSocketCompatibility(build, catalog)).toBeNull();
  });

  it("returns unknown when CPU cooler is absent", () => {
    const build = selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600");

    expect(evaluateCpuCoolerSocketCompatibility(build, catalog)).toBeNull();
  });

  it("returns compatible for a supported CPU socket", () => {
    const build = selectCpuCooler(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "cpu-cooler-deepcool-ag400",
    );

    expect(evaluateCpuCoolerSocketCompatibility(build, catalog)).toEqual({
      compatible: true,
    });
  });

  it("returns incompatible for an unsupported CPU socket", () => {
    const build = selectCpuCooler(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "cpu-cooler-compact-am4-120",
    );

    expect(evaluateCpuCoolerSocketCompatibility(build, catalog)).toEqual({
      compatible: false,
      reason: {
        code: "CPU_SOCKET_NOT_SUPPORTED",
        cpuSocket: "AM5",
        supportedSockets: ["AM4"],
      },
    });
  });

  it("does not mutate the original build", () => {
    const build = selectCpuCooler(
      selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
      "cpu-cooler-deepcool-ag400",
    );
    const before = { ...build };

    evaluateCpuCoolerSocketCompatibility(build, catalog);

    expect(build).toEqual(before);
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
      estimate: {
        cpuWatts: 65,
        gpuWatts: 250,
        systemBaseWatts: 100,
        estimatedComponentWatts: 315,
        estimatedLoadWatts: 415,
        headroomRatio: 1.25,
        requiredPsuWatts: 519,
      },
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
        estimate: {
          cpuWatts: 125,
          gpuWatts: 250,
          systemBaseWatts: 100,
          estimatedComponentWatts: 375,
          estimatedLoadWatts: 475,
          headroomRatio: 1.25,
          requiredPsuWatts: 594,
        },
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
      "psu-aerocool-cylon-500w",
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

describe("evaluateMotherboardCaseCompatibility", () => {
  it("returns unknown when motherboard is absent", () => {
    const build = selectCase(createEmptyBuild(), "case-corsair-4000d-airflow");

    expect(evaluateMotherboardCaseCompatibility(build, catalog)).toBeNull();
  });

  it("returns unknown when case is absent", () => {
    const build = selectMotherboard(
      createEmptyBuild(),
      "motherboard-msi-b650-tomahawk-wifi",
    );

    expect(evaluateMotherboardCaseCompatibility(build, catalog)).toBeNull();
  });

  it("returns compatible for an explicitly supported form factor", () => {
    const build = selectCase(
      selectMotherboard(
        createEmptyBuild(),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "case-corsair-4000d-airflow",
    );

    expect(evaluateMotherboardCaseCompatibility(build, catalog)).toEqual({
      compatible: true,
    });
  });

  it("returns incompatible when the case does not list the motherboard form factor", () => {
    const build = selectCase(
      selectMotherboard(
        createEmptyBuild(),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "case-cooler-master-n200",
    );

    expect(evaluateMotherboardCaseCompatibility(build, catalog)).toEqual({
      compatible: false,
      reason: {
        code: "FORM_FACTOR_NOT_SUPPORTED",
        motherboardFormFactor: "ATX",
        supportedMotherboardFormFactors: ["MicroATX"],
      },
    });
  });
});

describe("evaluateGpuCaseCompatibility", () => {
  it("returns unknown when GPU is absent", () => {
    const build = selectCase(createEmptyBuild(), "case-corsair-4000d-airflow");

    expect(evaluateGpuCaseCompatibility(build, catalog)).toBeNull();
  });

  it("returns unknown when case is absent", () => {
    const build = selectGpu(createEmptyBuild(), "gpu-asus-prime-rtx-5070-oc");

    expect(evaluateGpuCaseCompatibility(build, catalog)).toBeNull();
  });

  it("returns compatible when the GPU fits the case length limit", () => {
    const build = selectCase(
      selectGpu(createEmptyBuild(), "gpu-asus-prime-rtx-5070-oc"),
      "case-corsair-4000d-airflow",
    );

    expect(evaluateGpuCaseCompatibility(build, catalog)).toEqual({
      compatible: true,
    });
  });

  it("returns incompatible when the GPU exceeds the case length limit", () => {
    const build = selectCase(
      selectGpu(createEmptyBuild(), "gpu-asus-prime-rtx-5070-oc"),
      "case-generic-compact-matx-260",
    );

    expect(evaluateGpuCaseCompatibility(build, catalog)).toEqual({
      compatible: false,
      reason: {
        code: "GPU_LENGTH_EXCEEDED",
        gpuLengthMm: 304,
        maxGpuLengthMm: 260,
      },
    });
  });
});

describe("evaluateCpuCoolerCaseCompatibility", () => {
  it("returns unknown when CPU cooler is absent", () => {
    const build = selectCase(createEmptyBuild(), "case-corsair-4000d-airflow");

    expect(evaluateCpuCoolerCaseCompatibility(build, catalog)).toBeNull();
  });

  it("returns unknown when case is absent", () => {
    const build = selectCpuCooler(
      createEmptyBuild(),
      "cpu-cooler-deepcool-ag400",
    );

    expect(evaluateCpuCoolerCaseCompatibility(build, catalog)).toBeNull();
  });

  it("returns compatible when the cooler fits the case height limit", () => {
    const build = selectCase(
      selectCpuCooler(createEmptyBuild(), "cpu-cooler-deepcool-ag400"),
      "case-corsair-4000d-airflow",
    );

    expect(evaluateCpuCoolerCaseCompatibility(build, catalog)).toEqual({
      compatible: true,
    });
  });

  it("returns incompatible when the cooler exceeds the case height limit", () => {
    const build = selectCase(
      selectCpuCooler(createEmptyBuild(), "cpu-cooler-noctua-nh-d15"),
      "case-generic-compact-matx-260",
    );

    expect(evaluateCpuCoolerCaseCompatibility(build, catalog)).toEqual({
      compatible: false,
      reason: {
        code: "CPU_COOLER_HEIGHT_EXCEEDED",
        cpuCoolerHeightMm: 165,
        maxCpuCoolerHeightMm: 150,
      },
    });
  });

  it("does not mutate the original build", () => {
    const build = selectCase(
      selectCpuCooler(createEmptyBuild(), "cpu-cooler-deepcool-ag400"),
      "case-corsair-4000d-airflow",
    );
    const before = { ...build };

    evaluateCpuCoolerCaseCompatibility(build, catalog);

    expect(build).toEqual(before);
  });
});

describe("evaluateBuild", () => {
  it("evaluates an empty build", () => {
    expect(evaluateBuild(createEmptyBuild(), catalog)).toEqual({
      completion: "empty",
      compatibility: "unknown",
      missingComponents: ["cpu", "motherboard", "gpu", "memoryKit", "psu", "case", "cpuCooler"],
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
      missingComponents: ["motherboard", "gpu", "memoryKit", "psu", "case", "cpuCooler"],
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
      missingComponents: ["cpu", "gpu", "memoryKit", "psu", "case", "cpuCooler"],
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
      missingComponents: ["gpu", "memoryKit", "psu", "case", "cpuCooler"],
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
      missingComponents: ["gpu", "memoryKit", "psu", "case", "cpuCooler"],
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
      missingComponents: ["memoryKit", "psu", "case", "cpuCooler"],
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
      missingComponents: ["cpu", "gpu", "psu", "case", "cpuCooler"],
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
      missingComponents: ["gpu", "psu", "case", "cpuCooler"],
      issues: [],
    });
  });

  it("evaluates a complete compatible build", () => {
    const build = selectCpuCooler(
      selectCase(
        selectPsu(
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
        ),
        "case-corsair-4000d-airflow",
      ),
      "cpu-cooler-deepcool-ag400",
    );

    expect(evaluateBuild(build, catalog)).toEqual({
      completion: "complete",
      compatibility: "compatible",
      missingComponents: [],
      issues: [],
      power: {
        estimatedLoadWatts: 415,
        requiredPsuWatts: 519,
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
      "case",
      "cpuCooler",
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
    const build = selectCase(
      selectPsu(
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
      ),
      "case-corsair-4000d-airflow",
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
    const build = selectCpuCooler(
      selectCase(
        selectPsu(
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
          "psu-aerocool-cylon-500w",
        ),
        "case-generic-compact-matx-260",
      ),
      "cpu-cooler-noctua-nh-d15",
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
        message: "La PSU entrega 500 W y la build requiere al menos 594 W estimados.",
      },
      {
        code: "psu-missing-gpu-power-connectors",
        severity: "error",
        message:
          "La PSU no cubre los conectores dedicados requeridos por la GPU: 1x 12vhpwr.",
      },
      {
        code: "gpu-case-length-exceeded",
        severity: "error",
        message: "La GPU mide 304 mm y el gabinete soporta hasta 260 mm.",
      },
      {
        code: "cpu-cooler-case-height-exceeded",
        severity: "error",
        message: "El cooler mide 165 mm y el gabinete soporta hasta 150 mm.",
      },
    ]);
  });

  it("reports issues in deterministic compatibility-check order", () => {
    const build = selectCpuCooler(
      selectCase(
        selectPsu(
          selectMemoryKit(
            selectGpu(
              selectMotherboard(
                selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
                "motherboard-asus-prime-b760-plus",
              ),
              "gpu-asus-prime-rtx-5070-oc",
            ),
            "memory-corsair-vengeance-lpx-16gb-2x8-ddr4-3200",
          ),
          "psu-aerocool-cylon-500w",
        ),
        "case-generic-compact-matx-260",
      ),
      "cpu-cooler-test-am4-tall",
    );
    const testCatalog = {
      ...catalog,
      cpuCoolers: [
        ...catalog.cpuCoolers,
        {
          id: "cpu-cooler-test-am4-tall",
          kind: "cpuCooler",
          brand: "Test",
          model: "AM4 Tall",
          supportedSockets: ["AM4"],
          heightMm: 165,
        } as const,
      ],
    };

    expect(evaluateBuild(build, testCatalog).issues.map((issue) => issue.code)).toEqual(
      [
        "cpu-motherboard-socket-mismatch",
        "memory-motherboard-type-mismatch",
        "psu-insufficient-wattage",
        "psu-missing-gpu-power-connectors",
        "motherboard-case-form-factor-mismatch",
        "gpu-case-length-exceeded",
        "cpu-cooler-socket-mismatch",
        "cpu-cooler-case-height-exceeded",
      ],
    );
  });

  it("updates power evaluation when GPU changes", () => {
    const baseBuild = selectCpuCooler(
      selectCase(
        selectPsu(
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
          "psu-aerocool-cylon-500w",
        ),
        "case-corsair-4000d-airflow",
      ),
      "cpu-cooler-deepcool-ag400",
    );
    const withGpu = selectGpu(baseBuild, "gpu-asus-prime-rtx-5070-oc");

    expect(evaluateBuild(baseBuild, catalog).compatibility).toBe("compatible");
    expect(evaluateBuild(baseBuild, catalog).power).toEqual({
      estimatedLoadWatts: 340,
      requiredPsuWatts: 425,
    });
    expect(evaluateBuild(withGpu, catalog).compatibility).toBe("incompatible");
    expect(evaluateBuild(withGpu, catalog).power).toEqual({
      estimatedLoadWatts: 475,
      requiredPsuWatts: 594,
    });
  });

  it("updates power evaluation when CPU changes", () => {
    const baseBuild = selectCpuCooler(
      selectCase(
        selectPsu(
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
          "psu-generic-400w",
        ),
        "case-corsair-4000d-airflow",
      ),
      "cpu-cooler-deepcool-ag400",
    );
    const withCpu = selectCpu(baseBuild, "cpu-intel-core-i5-14600k");

    expect(evaluateBuild(baseBuild, catalog).compatibility).toBe("compatible");
    expect(evaluateBuild(baseBuild, catalog).power).toEqual({
      estimatedLoadWatts: 280,
      requiredPsuWatts: 350,
    });
    expect(evaluateBuild(withCpu, catalog).compatibility).toBe("incompatible");
    expect(evaluateBuild(withCpu, catalog).power).toEqual({
      estimatedLoadWatts: 340,
      requiredPsuWatts: 425,
    });
  });

  it("does not change power evaluation when motherboard changes", () => {
    const baseBuild = selectCase(
      selectPsu(
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
        "psu-generic-400w",
      ),
      "case-corsair-4000d-airflow",
    );
    const withMotherboard = selectMotherboard(
      baseBuild,
      "motherboard-msi-pro-z790-a-wifi-ddr4",
    );

    expect(evaluateBuild(withMotherboard, catalog).power).toEqual(
      evaluateBuild(baseBuild, catalog).power,
    );
  });

  it("does not change power evaluation when RAM changes", () => {
    const baseBuild = selectCase(
      selectPsu(
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
        "psu-generic-400w",
      ),
      "case-corsair-4000d-airflow",
    );
    const withMemory = selectMemoryKit(
      baseBuild,
      "memory-crucial-pro-32gb-2x16-ddr5-5600",
    );

    expect(evaluateBuild(withMemory, catalog).power).toEqual(
      evaluateBuild(baseBuild, catalog).power,
    );
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
      cpuCoolerIds: catalog.cpuCoolers.map((cpuCooler) => cpuCooler.id),
      motherboardIds: catalog.motherboards.map((motherboard) => motherboard.id),
      gpuIds: catalog.gpus.map((gpu) => gpu.id),
      memoryKitIds: catalog.memoryKits.map((memoryKit) => memoryKit.id),
      psuIds: catalog.psus.map((psu) => psu.id),
    };

    evaluateBuild(createEmptyBuild(), catalog);

    expect({
      cpuIds: catalog.cpus.map((cpu) => cpu.id),
      cpuCoolerIds: catalog.cpuCoolers.map((cpuCooler) => cpuCooler.id),
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

  it("keeps case compatibility centralized outside React", () => {
    const clientSource = readFileSync(
      join(process.cwd(), "src/app/_components/pc-builder-client.tsx"),
      "utf8",
    );

    expect(clientSource).not.toContain("supportedMotherboardFormFactors.includes");
    expect(clientSource).not.toContain("lengthMm <=");
    expect(clientSource).not.toContain("maxGpuLengthMm >=");
    expect(evaluateBuild).toBeTypeOf("function");
  });

  it("keeps CPU cooler compatibility centralized outside React", () => {
    const clientSource = readFileSync(
      join(process.cwd(), "src/app/_components/pc-builder-client.tsx"),
      "utf8",
    );

    expect(clientSource).not.toContain("supportedSockets.includes");
    expect(clientSource).not.toContain("heightMm <=");
    expect(clientSource).not.toContain("maxCpuCoolerHeightMm >=");
    expect(evaluateBuild).toBeTypeOf("function");
  });
});

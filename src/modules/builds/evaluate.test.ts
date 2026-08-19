import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getAllCpus,
  getAllGpus,
  getAllMemoryKits,
  getAllMotherboards,
} from "../catalog/catalog";

import {
  createEmptyBuild,
  selectCpu,
  selectGpu,
  selectMemoryKit,
  selectMotherboard,
} from "./build";
import {
  evaluateBuild,
  evaluateCpuMotherboardCompatibility,
  evaluateMemoryMotherboardCompatibility,
} from "./evaluate";

const catalog = {
  cpus: getAllCpus(),
  motherboards: getAllMotherboards(),
  gpus: getAllGpus(),
  memoryKits: getAllMemoryKits(),
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

describe("evaluateBuild", () => {
  it("evaluates an empty build", () => {
    expect(evaluateBuild(createEmptyBuild(), catalog)).toEqual({
      completion: "empty",
      compatibility: "unknown",
      missingComponents: ["cpu", "motherboard", "gpu", "memoryKit"],
      issues: [],
    });
  });

  it("evaluates a build with only CPU selected", () => {
    expect(
      evaluateBuild(selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"), catalog),
    ).toEqual({
      completion: "partial",
      compatibility: "unknown",
      missingComponents: ["motherboard", "gpu", "memoryKit"],
      issues: [],
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
      missingComponents: ["cpu", "gpu", "memoryKit"],
      issues: [],
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
      missingComponents: ["gpu", "memoryKit"],
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
      missingComponents: ["gpu", "memoryKit"],
      issues: [
        {
          code: "cpu-motherboard-socket-mismatch",
          severity: "error",
          message: "La CPU utiliza AM5 y la motherboard utiliza AM4.",
        },
      ],
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
      missingComponents: ["memoryKit"],
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
      missingComponents: ["cpu", "gpu"],
      issues: [],
    });
  });

  it("evaluates CPU motherboard and RAM compatibility without GPU as compatible", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateBuild(build, catalog)).toMatchObject({
      completion: "partial",
      compatibility: "compatible",
      missingComponents: ["gpu"],
      issues: [],
    });
  });

  it("evaluates a complete compatible build", () => {
    const build = selectMemoryKit(
      selectGpu(
        selectMotherboard(
          selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
          "motherboard-msi-b650-tomahawk-wifi",
        ),
        "gpu-asus-prime-rtx-5070-oc",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateBuild(build, catalog)).toEqual({
      completion: "complete",
      compatibility: "compatible",
      missingComponents: [],
      issues: [],
    });
  });

  it("returns missing components in deterministic order without duplicates", () => {
    const build = selectGpu(createEmptyBuild(), "gpu-asus-prime-rtx-5070-oc");

    expect(evaluateBuild(build, catalog).missingComponents).toEqual([
      "cpu",
      "motherboard",
      "memoryKit",
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

  it("reports both incompatibilities as issues", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-asus-prime-b550m-a",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateBuild(build, catalog).issues).toEqual([
      {
        code: "cpu-motherboard-socket-mismatch",
        severity: "error",
        message: "La CPU utiliza AM5 y la motherboard utiliza AM4.",
      },
      {
        code: "memory-motherboard-type-mismatch",
        severity: "error",
        message: "La RAM utiliza DDR5 y la motherboard utiliza DDR4.",
      },
    ]);
  });

  it("reports issues in deterministic compatibility-check order", () => {
    const build = selectMemoryKit(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-asus-prime-b550m-a",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );

    expect(evaluateBuild(build, catalog).issues.map((issue) => issue.code)).toEqual(
      [
        "cpu-motherboard-socket-mismatch",
        "memory-motherboard-type-mismatch",
      ],
    );
  });

  it("does not change compatibility when only GPU changes", () => {
    const baseBuild = selectMemoryKit(
      selectMotherboard(
        selectCpu(createEmptyBuild(), "cpu-amd-ryzen-5-7600"),
        "motherboard-msi-b650-tomahawk-wifi",
      ),
      "memory-gskill-ripjaws-s5-32gb-2x16-ddr5-6000",
    );
    const withGpu = selectGpu(baseBuild, "gpu-asus-prime-rtx-5070-oc");

    expect(evaluateBuild(baseBuild, catalog).compatibility).toBe("compatible");
    expect(evaluateBuild(withGpu, catalog).compatibility).toBe("compatible");
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
    };

    evaluateBuild(createEmptyBuild(), catalog);

    expect({
      cpuIds: catalog.cpus.map((cpu) => cpu.id),
      motherboardIds: catalog.motherboards.map((motherboard) => motherboard.id),
      gpuIds: catalog.gpus.map((gpu) => gpu.id),
      memoryKitIds: catalog.memoryKits.map((memoryKit) => memoryKit.id),
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
    expect(evaluateBuild(withMemory, catalog).compatibility).toBe("compatible");
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
});

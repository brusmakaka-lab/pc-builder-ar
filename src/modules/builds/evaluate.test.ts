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
      compatibility: "compatible",
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
      compatibility: "compatible",
      missingComponents: ["memoryKit"],
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

    expect(evaluateBuild(baseBuild, catalog).compatibility).toBe("compatible");
    expect(evaluateBuild(withGpu, catalog).compatibility).toBe("compatible");
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
});

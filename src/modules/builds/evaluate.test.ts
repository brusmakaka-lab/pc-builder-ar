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
import { evaluateCpuMotherboardCompatibility } from "./evaluate";

const catalog = {
  cpus: getAllCpus(),
  motherboards: getAllMotherboards(),
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

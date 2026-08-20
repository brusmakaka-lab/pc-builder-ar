import { describe, expect, it } from "vitest";

import {
  clearCase,
  clearCpu,
  clearCpuCooler,
  clearGpu,
  clearMemoryKit,
  clearMotherboard,
  clearPsu,
  createEmptyBuild,
  selectCpu,
  selectCase,
  selectCpuCooler,
  selectGpu,
  selectMemoryKit,
  selectMotherboard,
  selectPsu,
} from "./build";

describe("PcBuild operations", () => {
  it("creates an empty build", () => {
    expect(createEmptyBuild()).toEqual({
      cpuId: null,
      cpuCoolerId: null,
      motherboardId: null,
      gpuId: null,
      memoryKitId: null,
      psuId: null,
      caseId: null,
    });
  });

  it("starts with all component positions empty", () => {
    const build = createEmptyBuild();

    expect(build.cpuId).toBeNull();
    expect(build.cpuCoolerId).toBeNull();
    expect(build.motherboardId).toBeNull();
    expect(build.gpuId).toBeNull();
    expect(build.memoryKitId).toBeNull();
    expect(build.psuId).toBeNull();
    expect(build.caseId).toBeNull();
  });

  it("selects and replaces a CPU without mutating the previous build", () => {
    const initialBuild = createEmptyBuild();
    const withCpu = selectCpu(initialBuild, "cpu-a");
    const withReplacement = selectCpu(withCpu, "cpu-b");

    expect(initialBuild.cpuId).toBeNull();
    expect(withCpu.cpuId).toBe("cpu-a");
    expect(withReplacement.cpuId).toBe("cpu-b");
    expect(withReplacement).not.toBe(withCpu);
  });

  it("selects and replaces a CPU cooler", () => {
    const withCpuCooler = selectCpuCooler(createEmptyBuild(), "cooler-a");
    const withReplacement = selectCpuCooler(withCpuCooler, "cooler-b");

    expect(withCpuCooler.cpuCoolerId).toBe("cooler-a");
    expect(withReplacement.cpuCoolerId).toBe("cooler-b");
    expect(withReplacement).not.toBe(withCpuCooler);
  });

  it("selects a motherboard", () => {
    expect(selectMotherboard(createEmptyBuild(), "motherboard-a")).toMatchObject(
      {
        motherboardId: "motherboard-a",
      },
    );
  });

  it("selects a GPU", () => {
    expect(selectGpu(createEmptyBuild(), "gpu-a")).toMatchObject({
      gpuId: "gpu-a",
    });
  });

  it("selects a memory kit", () => {
    expect(selectMemoryKit(createEmptyBuild(), "memory-a")).toMatchObject({
      memoryKitId: "memory-a",
    });
  });

  it("selects and replaces a PSU", () => {
    const withPsu = selectPsu(createEmptyBuild(), "psu-a");
    const withReplacement = selectPsu(withPsu, "psu-b");

    expect(withPsu.psuId).toBe("psu-a");
    expect(withReplacement.psuId).toBe("psu-b");
    expect(withReplacement).not.toBe(withPsu);
  });

  it("selects and replaces a case", () => {
    const withCase = selectCase(createEmptyBuild(), "case-a");
    const withReplacement = selectCase(withCase, "case-b");

    expect(withCase.caseId).toBe("case-a");
    expect(withReplacement.caseId).toBe("case-b");
    expect(withReplacement).not.toBe(withCase);
  });

  it("clears individual selections", () => {
    const build = selectCpuCooler(
      selectCase(
        selectPsu(
          selectMemoryKit(
            selectGpu(
              selectMotherboard(
                selectCpu(createEmptyBuild(), "cpu-a"),
                "board-a",
              ),
              "gpu-a",
            ),
            "memory-a",
          ),
          "psu-a",
        ),
        "case-a",
      ),
      "cooler-a",
    );

    expect(clearCpu(build).cpuId).toBeNull();
    expect(clearMotherboard(build).motherboardId).toBeNull();
    expect(clearGpu(build).gpuId).toBeNull();
    expect(clearMemoryKit(build).memoryKitId).toBeNull();
    expect(clearPsu(build).psuId).toBeNull();
    expect(clearCase(build).caseId).toBeNull();
    expect(clearCpuCooler(build).cpuCoolerId).toBeNull();
  });

  it("does not alter other positions when one position changes", () => {
    const build = selectCpuCooler(
      selectCase(
        selectPsu(
          selectMemoryKit(
            selectGpu(
              selectMotherboard(
                selectCpu(createEmptyBuild(), "cpu-a"),
                "board-a",
              ),
              "gpu-a",
            ),
            "memory-a",
          ),
          "psu-a",
        ),
        "case-a",
      ),
      "cooler-a",
    );

    expect(selectCpu(build, "cpu-b")).toEqual({
      cpuId: "cpu-b",
      cpuCoolerId: "cooler-a",
      motherboardId: "board-a",
      gpuId: "gpu-a",
      memoryKitId: "memory-a",
      psuId: "psu-a",
      caseId: "case-a",
    });
  });
});

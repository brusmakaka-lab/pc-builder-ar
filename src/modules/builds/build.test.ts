import { describe, expect, it } from "vitest";

import {
  clearCpu,
  clearGpu,
  clearMemoryKit,
  clearMotherboard,
  clearPsu,
  createEmptyBuild,
  selectCpu,
  selectGpu,
  selectMemoryKit,
  selectMotherboard,
  selectPsu,
} from "./build";

describe("PcBuild operations", () => {
  it("creates an empty build", () => {
    expect(createEmptyBuild()).toEqual({
      cpuId: null,
      motherboardId: null,
      gpuId: null,
      memoryKitId: null,
      psuId: null,
    });
  });

  it("starts with all component positions empty", () => {
    const build = createEmptyBuild();

    expect(build.cpuId).toBeNull();
    expect(build.motherboardId).toBeNull();
    expect(build.gpuId).toBeNull();
    expect(build.memoryKitId).toBeNull();
    expect(build.psuId).toBeNull();
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

  it("clears individual selections", () => {
    const build = selectPsu(
      selectMemoryKit(
        selectGpu(
          selectMotherboard(selectCpu(createEmptyBuild(), "cpu-a"), "board-a"),
          "gpu-a",
        ),
        "memory-a",
      ),
      "psu-a",
    );

    expect(clearCpu(build).cpuId).toBeNull();
    expect(clearMotherboard(build).motherboardId).toBeNull();
    expect(clearGpu(build).gpuId).toBeNull();
    expect(clearMemoryKit(build).memoryKitId).toBeNull();
    expect(clearPsu(build).psuId).toBeNull();
  });

  it("does not alter other positions when one position changes", () => {
    const build = selectPsu(
      selectMemoryKit(
        selectGpu(
          selectMotherboard(selectCpu(createEmptyBuild(), "cpu-a"), "board-a"),
          "gpu-a",
        ),
        "memory-a",
      ),
      "psu-a",
    );

    expect(selectCpu(build, "cpu-b")).toEqual({
      cpuId: "cpu-b",
      motherboardId: "board-a",
      gpuId: "gpu-a",
      memoryKitId: "memory-a",
      psuId: "psu-a",
    });
  });
});
